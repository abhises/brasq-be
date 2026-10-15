import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  // 127.0.0.1 in production (nginx in front); all interfaces by default for Docker/dev
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: required('DATABASE_URL'),
  publicUrl: (process.env.PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),
  adminEmail: required('ADMIN_EMAIL'),
  adminPassword: required('ADMIN_PASSWORD'),
  authSecret: required('AUTH_SECRET'),
  apiToken: process.env.API_TOKEN ?? '',
  storageDriver: (process.env.STORAGE_DRIVER || (isProd ? 's3' : 'local')) as 'local' | 's3',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    publicUrl: (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, ''),
    prefix: process.env.S3_PREFIX ?? 'uploads/',
  },
};
