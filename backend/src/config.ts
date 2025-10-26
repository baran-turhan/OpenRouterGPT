import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  env: process.env.NODE_ENV ?? 'development',
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'
  },
  telemetry: {
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'madlen-chat-backend',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces'
  },
  historyFile: process.env.HISTORY_FILE_PATH ?? path.join(rootDir, 'data', 'history.json'),
  modelCacheTtlMs: Number(process.env.MODEL_CACHE_TTL_MS ?? 1000 * 60 * 5),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(rootDir, 'uploads')
};

