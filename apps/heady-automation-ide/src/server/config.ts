import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Priority:
// 1. .env in current directory (apps/heady-automation-ide)
// 2. .env.local in project root
// 3. .env in project root

// We'll trust the existing loading mechanism in index.ts or just ensure we have values
// But for this config module to be standalone, we should load them if not present.

if (!process.env.PORT) {
    dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
    dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
    dotenv.config(); // Load from CWD
}

export const config = {
  server: {
    port: parseInt(process.env.PORT || '4100', 10),
    env: process.env.NODE_ENV || 'development',
    apiKey: process.env.HC_AUTOMATION_API_KEY,
    allowedOrigins: (process.env.HC_AUTOMATION_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    allowNonLocalOrigins: process.env.HC_ALLOW_NONLOCAL_ORIGINS === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  database: {
    url: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'heady'}:${process.env.POSTGRES_PASSWORD || 'heady123'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'headysystems_dev'}`,
  },
  task: {
    concurrency: parseInt(process.env.TASK_CONCURRENCY || '5', 10),
    maxRetries: parseInt(process.env.TASK_MAX_RETRIES || '3', 10),
  },
  monitoring: {
    enabled: process.env.HC_MONITORING_ENABLED !== 'false',
    interval: parseInt(process.env.HC_MONITORING_INTERVAL_MS || '5000', 10),
  }
};
