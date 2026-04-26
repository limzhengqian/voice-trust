import * as trustModel from '../models/trustModel.js';
import * as userModel from '../models/userModel.js';
import { graph } from './graphService.js';
import { recalcTrustScore } from './trustScoreService.js';

export async function createTrustLink({ sender_id, receiver_id, relationship }) {
  if (sender_id === receiver_id) throw new Error('Cannot create trust link to yourself.');
  const sender = await userModel.getUser(sender_id);
  const receiver = await userModel.getUser(receiver_id);
  if (!sender)   throw new Error(`Sender ${sender_id} not found`);
  if (!receiver) throw new Error(`Receiver ${receiver_id} not found`);

  const req = await trustModel.createTrustRequest({ sender_id, receiver_id, relationship });
  await graph.ensureUser(sender_id, sender.name);
  await graph.ensureUser(receiver_id, receiver.name);
  return req;
}

export async function acceptTrustLink({ requestId }) {
  const req = await trustModel.getTrustRequest(requestId);
  if (!req) throw new Error('Trust request not found');
  if (req.status !== 'pending') throw new Error(`Request is already ${req.status}`);

  const updated = await trustModel.setTrustRequestStatus(requestId, 'accepted');

  // Build the bidirectional trust edge in the graph
  await graph.addTrust(req.sender_id, req.receiver_id, {
    relationship: req.relationship || '',
    strength: 0.75,
  });

  // Recalculate scores for both ends since the network grew.
  await recalcTrustScore(req.sender_id);
  await recalcTrustScore(req.receiver_id);
  return updated;
}

export async function rejectTrustLink({ requestId }) {
  const req = await trustModel.getTrustRequest(requestId);
  if (!req) throw new Error('Trust request not found');
  return trustModel.setTrustRequestStatus(requestId, 'rejected');
}

// Network view: returns direct (1-hop), extended (2-hop) and pending requests.
export async function getNetwork(userId) {
  const me = await userModel.getUser(userId);
  if (!me) throw new Error('User not found');

  const direct = await graph.directTrust(userId);
  const extended = await graph.secondDegreeTrust(userId);
  const incoming = await trustModel.listTrustRequests({ userId, status: 'pending' });

  // Hydrate user details
  const allIds = new Set([...direct.map(d => d.userId), ...extended.map(d => d.userId)]);
  const userDetails = {};
  for (const id of allIds) userDetails[id] = await userModel.getUser(id);

  // Determine role: who sent a trust request that was accepted defines guarantor/guarantee
  const accepted = await trustModel.listTrustRequests({ userId, status: 'accepted' });
  const roleByPeer = {};
  for (const r of accepted) {
    const peer = r.sender_id === userId ? r.receiver_id : r.sender_id;
    // Sender of an accepted link = someone you trust as a guarantee.
    // Receiver who accepts = your guarantor (they back you).
    roleByPeer[peer] = r.sender_id === userId ? 'guarantee' : 'guarantor';
  }

  // Hydrate relationship settings (description, liability_cap) from trust_requests.
  const settingsByPeer = {};
  for (const r of accepted) {
    const peer = r.sender_id === userId ? r.receiver_id : r.sender_id;
    settingsByPeer[peer] = {
      relationship: r.relationship,
      description: r.description,
      liability_cap: r.liability_cap,
    };
  }

  const directOut = direct.map(d => ({
    ...userDetails[d.userId],
    relationship: settingsByPeer[d.userId]?.relationship || d.relationship,
    description: settingsByPeer[d.userId]?.description || null,
    liability_cap: settingsByPeer[d.userId]?.liability_cap ?? 5000,
    strength: d.strength,
    role: roleByPeer[d.userId] || 'guarantee',
    hop: 1,
  }));

  const extendedOut = extended
    .filter(e => userDetails[e.userId])
    .map(e => ({
      ...userDetails[e.userId],
      via: e.viaUserId,
      strength: 0.5,
      role: 'extended',
      hop: 2,
    }));

  return {
    me,
    direct: directOut,
    extended: extendedOut,
    pending: incoming,
  };
}

// Strength = 0..1, derived from edge strength average.
export async function getTrustStrength(userId) {
  const direct = await graph.directTrust(userId);
  if (direct.length === 0) return { strength: 0, links: 0 };
  const avg = direct.reduce((a, d) => a + (d.strength || 0.5), 0) / direct.length;
  return { strength: Number(avg.toFixed(2)), links: direct.length };
}

// Path discovery between two users via TRUSTS edges (max 3 hops)
export async function getTrustPath(fromId, toId) {
  return graph.path(fromId, toId);
}

export async function updateRelationshipSettings({ user_id, peer_id, relationship, description, liability_cap }) {
  const patch = {};
  if (relationship !== undefined) patch.relationship = relationship;
  if (description  !== undefined) patch.description = description;
  if (liability_cap !== undefined) patch.liability_cap = Number(liability_cap);
  return trustModel.updateRelationshipSettings(user_id, peer_id, patch);
}
