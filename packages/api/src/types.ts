export type Env = {
  DB: D1Database;
  AUTH: KVNamespace;
  UPLOADS: R2Bucket;
  SYNC_ROOMS: DurableObjectNamespace;
  APP_ENV?: string;
  APP_ORIGIN?: string;
  JWT_ISSUER?: string;
  ACCESS_TOKEN_TTL_SECONDS?: string;
  JWT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string | null;
};
