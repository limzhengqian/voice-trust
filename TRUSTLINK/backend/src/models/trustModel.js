import { randomUUID } from 'crypto';
import { config } from '../config/index.js';
import { query } from '../db/pgClient.js';
import { memDb } from '../db/memoryStore.js';

const usePg = () => config.pg.enabled;

export async function createTrustRequest({ sender_id, receiver_id, relationship }) {
  if (!usePg()) return memDb.createTrustRequest({ sender_id, receiver_id, relationship });
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO trust_requests (id, sender_id, receiver_id, relationship, status)
     VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
    [id, sender_id, receiver_id, relationship || null]
  );
  return rows[0];
}

export async function getTrustRequest(id) {
  if (!usePg()) return memDb.getTrustRequest(id);
  const { rows } = await query('SELECT * FROM trust_requests WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function setTrustRequestStatus(id, status) {
  if (!usePg()) return memDb.updateTrustRequestStatus(id, status);
  const { rows } = await query(
    `UPDATE trust_requests SET status=$2, responded_at=NOW() WHERE id=$1 RETURNING *`,
    [id, status]
  );
  return rows[0] || null;
}

export async function listTrustRequests({ userId, status } = {}) {
  if (!usePg()) return memDb.listTrustRequests({ userId, status });
  const where = [];
  const params = [];
  if (userId) {
    params.push(userId);
    where.push(`(sender_id = $${params.length} OR receiver_id = $${params.length})`);
  }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const sql = 'SELECT * FROM trust_requests' + (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
              ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  return rows;
}

// Update settings (relationship, description, liability cap) on the
// accepted trust edge between two users. Updates the most recent record
// regardless of who initiated the request.
export async function updateRelationshipSettings(userA, userB, patch) {
  const all = await listTrustRequests({ userId: userA });
  const edge = all.find(r =>
    (r.sender_id === userA && r.receiver_id === userB) ||
    (r.sender_id === userB && r.receiver_id === userA)
  );
  if (!edge) return null;
  if (!config.pg.enabled) {
    Object.assign(edge, patch);
    return edge;
  }
  const fields = Object.keys(patch);
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const params = [edge.id, ...fields.map(f => patch[f])];
  const { rows } = await query(
    `UPDATE trust_requests SET ${setClauses} WHERE id = $1 RETURNING *`, params
  );
  return rows[0] || null;
}

export async function listAcceptedEdges(userId) {
  if (!usePg()) return memDb.listAcceptedTrustEdges(userId);
  const { rows } = await query(
    `SELECT * FROM trust_requests
     WHERE status='accepted' AND (sender_id=$1 OR receiver_id=$1)`,
    [userId]
  );
  return rows;
}
