import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { s3, BUCKET } from './client';

const PUT_EXPIRY_SECONDS = 600; // 10 minutes
const GET_EXPIRY_SECONDS = 3600; // 1 hour

export async function createPresignedPutUrl(
  fileKey: string,
  contentType: string,
  fileSizeBytes: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  return getSignedUrl(s3, command, { expiresIn: PUT_EXPIRY_SECONDS });
}

export async function createPresignedGetUrl(
  fileKey: string,
  fileName: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });

  return getSignedUrl(s3, command, { expiresIn: GET_EXPIRY_SECONDS });
}

export async function createPresignedInlineUrl(
  fileKey: string,
  fileName: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ResponseContentDisposition: `inline; filename="${fileName}"`,
  });

  return getSignedUrl(s3, command, { expiresIn: GET_EXPIRY_SECONDS });
}

export async function headObject(
  fileKey: string,
): Promise<{ contentLength: number; contentType: string } | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
    });
    const response = await s3.send(command);
    return {
      contentLength: response.ContentLength ?? 0,
      contentType: response.ContentType ?? 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

export async function getObjectBuffer(fileKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${fileKey}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteObject(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });
  await s3.send(command);
}

export async function deleteObjects(fileKeys: string[]): Promise<void> {
  await Promise.all(fileKeys.map((key) => deleteObject(key)));
}
