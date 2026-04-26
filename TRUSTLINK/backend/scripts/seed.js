// Run: node scripts/seed.js
// Seeds the configured store (PostgreSQL or in-memory) with mock users,
// trust links and a couple of loans. Safe to re-run.

import { seedIfEmpty } from '../src/scripts/seedRuntime.js';

(async () => {
  await seedIfEmpty();
  console.log('✓ Seed complete');
  process.exit(0);
})();
