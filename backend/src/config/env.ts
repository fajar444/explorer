export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:12345@localhost:5432/explorer_db',
  PORT: Number(process.env.PORT ?? 3000),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  STORAGE_DIR: process.env.STORAGE_DIR ?? './storage',
  MAX_UPLOAD_SIZE: Number(process.env.MAX_UPLOAD_SIZE ?? 200 * 1024 * 1024),
} as const;
