import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  pg: {
    enabled: process.env.USE_PG === 'true',
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  },

  neptune: {
    enabled: process.env.USE_NEPTUNE === 'true',
    endpoint: process.env.NEPTUNE_ENDPOINT,
  },
};
