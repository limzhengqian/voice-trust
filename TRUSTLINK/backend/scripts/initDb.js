// Run: node scripts/initDb.js
// Applies schema.sql to the configured PostgreSQL instance.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../src/config/index.js';
import { getPool } from '../src/db/pgClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!config.pg.enabled) {
    console.error('USE_PG=false — nothing to do. Set USE_PG=true in .env first.');
    process.exit(1);
  }
  const sql = readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');
  const pool = getPool();
  await pool.query(sql);
  console.log('✓ Schema applied to', config.pg.host);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
