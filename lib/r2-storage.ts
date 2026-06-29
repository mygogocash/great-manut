/**
 * Cloudflare R2 attachment storage abstraction.
 * Upload path: Worker presigned URL → R2; metadata in Convex `attachments.r2Key`.
 */

export const R2_BINDING_NAME = "MANUT_ATTACHMENTS";

export type R2StorageConfig = {
  bucketName: string;
  publicBaseUrl?: string;
};

export function isR2Configured(): boolean {
  return Boolean(process.env.MANUT_R2_BUCKET_NAME);
}

export function r2StorageConfig(): R2StorageConfig | null {
  const bucketName = process.env.MANUT_R2_BUCKET_NAME;
  if (!bucketName) {
    return null;
  }
  return {
    bucketName,
    publicBaseUrl: process.env.MANUT_R2_PUBLIC_BASE_URL,
  };
}

/** Build a download path for Worker proxy routes (when R2 binding is active). */
export function attachmentDownloadPath(orgId: string, r2Key: string): string {
  return `/api/attachments/${orgId}/${encodeURIComponent(r2Key)}`;
}
