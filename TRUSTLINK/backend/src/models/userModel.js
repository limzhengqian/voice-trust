import { config } from '../config/index.js';
import { query } from '../db/pgClient.js';
import { memDb } from '../db/memoryStore.js';

const usePg = () => config.pg.enabled;

export async function getUser(id) {
  if (!usePg()) return memDb.getUser(id);
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function listUsers() {
  if (!usePg()) return memDb.listUsers();
  const { rows } = await query('SELECT * FROM users ORDER BY name ASC');
  return rows;
}

export async function upsertUser(u) {
  if (!usePg()) return memDb.upsertUser(u);
  const { rows } = await query(
    `INSERT INTO users (id, name, phone, email, avatar_initials, avatar_color, trust_score)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, 50))
     ON CONFLICT (id) DO UPDATE
        SET name=$2, phone=$3, email=$4, avatar_initials=$5, avatar_color=$6,
            trust_score=COALESCE($7, users.trust_score)
     RETURNING *`,
    [u.id, u.name, u.phone, u.email, u.avatar_initials, u.avatar_color, u.trust_score]
  );
  return rows[0];
}

export async function setTrustScore(id, score) {
  if (!usePg()) return memDb.updateUserScore(id, score);
  const { rows } = await query(
    'UPDATE users SET trust_score = $2 WHERE id = $1 RETURNING *',
    [id, score]
  );
  return rows[0];
}
