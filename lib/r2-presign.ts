import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function getPresignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: path,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedUrls(paths: (string | null)[]): Promise<Record<string, string>> {
  const valid = paths.filter(Boolean) as string[];
  if (!valid.length) return {};
  const entries = await Promise.all(valid.map(async p => [p, await getPresignedUrl(p)] as const));
  return Object.fromEntries(entries);
}
