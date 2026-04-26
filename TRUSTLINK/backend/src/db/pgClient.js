import pg from 'pg';
import { config } from '../config/index.js';

let pool = null;

export function getPool() {
  if (!config.pg.enabled) return null;
  if (!pool) {
    pool = new pg.Pool({
      host: config.pg.host,
      port: config.pg.port,
      database: config.pg.database,
      user: config.pg.user,
      password: config.pg.password,
      ssl: config.pg.ssl,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
    pool.on('error', (err) => console.error('[pg] pool error', err));
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('PostgreSQL is not enabled (set USE_PG=true).');
  return p.query(text, params);
}
