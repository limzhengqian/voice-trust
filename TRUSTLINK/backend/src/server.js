import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { config } from './config/index.js';
import trustRoutes from './routes/trustRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedIfEmpty } from './scripts/seedRuntime.js';

const app = express();

app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({
  ok: true,
  env: config.env,
  pg: config.pg.enabled,
  neptune: config.neptune.enabled,
  time: new Date().toISOString(),
}));

app.use('/users', userRoutes);
app.use('/trust', trustRoutes);
app.use('/loan',  loanRoutes);

app.use(errorHandler);

(async () => {
  await seedIfEmpty();   // populates mock users + a sample network for the demo
  app.listen(config.port, () => {
    console.log(`✓ TNG VoiceTrust API listening on :${config.port}`);
    console.log(`  PG enabled:      ${config.pg.enabled}`);
    console.log(`  Neptune enabled: ${config.neptune.enabled}`);
  });
})();
