import { S3Client } from '@aws-sdk/client-s3';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
const MINIO_PORT = process.env.MINIO_PORT ?? '9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT;
const MINIO_PUBLIC_USE_SSL = process.env.MINIO_PUBLIC_USE_SSL === 'true';

export const BUCKET = process.env.MINIO_BUCKET ?? 'tyf-documents';

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | undefined;
  s3PresignClient: S3Client | undefined;
};

const protocol = MINIO_USE_SSL ? 'https' : 'http';

const client =
  globalForS3.s3Client ??
  new S3Client({
    endpoint: `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: MINIO_ACCESS_KEY,
      secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });

// Separate client for presigned URLs - uses public endpoint so browsers can
// reach it. Falls back to internal client when no public endpoint is configured
// (local dev).
const presignClient = MINIO_PUBLIC_ENDPOINT
  ? (globalForS3.s3PresignClient ??
    new S3Client({
      endpoint: `${MINIO_PUBLIC_USE_SSL ? 'https' : 'http'}://${MINIO_PUBLIC_ENDPOINT}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    }))
  : client;

if (process.env.NODE_ENV !== 'production') {
  globalForS3.s3Client = client;
  globalForS3.s3PresignClient = presignClient;
}

export const s3 = client;
export const s3Presign = presignClient;
