import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface R2Config {
  accountId: string;
  accessKey: string;
  secretKey: string;
  bucket:    string;
  publicUrl: string;
}

function readConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket    = process.env.R2_BUCKET;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!accountId || !accessKey || !secretKey || !bucket || !publicUrl) {
    const missing = [
      ["R2_ACCOUNT_ID", accountId],
      ["R2_ACCESS_KEY_ID", accessKey],
      ["R2_SECRET_ACCESS_KEY", secretKey],
      ["R2_BUCKET", bucket],
      ["NEXT_PUBLIC_R2_PUBLIC_URL", publicUrl],
    ].filter(([, v]) => !v).map(([k]) => k).join(", ");
    throw new Error(`R2 not configured: missing ${missing}`);
  }
  return { accountId, accessKey, secretKey, bucket, publicUrl };
}

let client: S3Client | null = null;
let clientConfigKey: string | null = null;

function getClient(cfg: R2Config): S3Client {
  // Cache the client per (accountId, accessKey) so credential rotation rebuilds it.
  const key = `${cfg.accountId}:${cfg.accessKey}`;
  if (!client || clientConfigKey !== key) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    });
    clientConfigKey = key;
  }
  return client;
}

export interface PresignedUpload {
  uploadUrl: string;
  fileUrl:   string;
  key:       string;
}

export async function createPresignedUpload(params: {
  key:           string;
  contentType:   string;
  contentLength: number;
}): Promise<PresignedUpload> {
  const cfg = readConfig();
  const cmd = new PutObjectCommand({
    Bucket:        cfg.bucket,
    Key:           params.key,
    ContentType:   params.contentType,
    ContentLength: params.contentLength,
  });
  // 5 minutes is enough for a 50 MB upload on slow connections, short enough
  // to limit replay if the URL leaks.
  const uploadUrl = await getSignedUrl(getClient(cfg), cmd, { expiresIn: 300 });
  return {
    uploadUrl,
    fileUrl: `${cfg.publicUrl}/${params.key}`,
    key:     params.key,
  };
}
