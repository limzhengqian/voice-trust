import * as trustService from '../services/trustService.js';
import * as trustModel from '../models/trustModel.js';

export async function postTrustRequest(req, res, next) {
  try {
    const { sender_id, receiver_id, relationship } = req.body;
    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id required' });
    }
    const out = await trustService.createTrustLink({ sender_id, receiver_id, relationship });
    res.status(201).json(out);
  } catch (e) { next(e); }
}

export async function postTrustAccept(req, res, next) {
  try {
    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: 'request_id required' });
    const out = await trustService.acceptTrustLink({ requestId: request_id });
    res.json(out);
  } catch (e) { next(e); }
}

export async function postTrustReject(req, res, next) {
  try {
    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: 'request_id required' });
    const out = await trustService.rejectTrustLink({ requestId: request_id });
    res.json(out);
  } catch (e) { next(e); }
}

export async function getTrustNetwork(req, res, next) {
  try {
    const out = await trustService.getNetwork(req.params.userId);
    res.json(out);
  } catch (e) { next(e); }
}

export async function getTrustStrength(req, res, next) {
  try {
    const out = await trustService.getTrustStrength(req.params.userId);
    res.json(out);
  } catch (e) { next(e); }
}

export async function postRelationshipUpdate(req, res, next) {
  try {
    const { user_id, peer_id, relationship, description, liability_cap } = req.body;
    if (!user_id || !peer_id) return res.status(400).json({ error: 'user_id and peer_id required' });
    const out = await trustService.updateRelationshipSettings({ user_id, peer_id, relationship, description, liability_cap });
    if (!out) return res.status(404).json({ error: 'Trust edge not found' });
    res.json(out);
  } catch (e) { next(e); }
}

export async function getTrustRequests(req, res, next) {
  try {
    const { user_id, status } = req.query;
    const rows = await trustModel.listTrustRequests({ userId: user_id, status });
    res.json(rows);
  } catch (e) { next(e); }
}
