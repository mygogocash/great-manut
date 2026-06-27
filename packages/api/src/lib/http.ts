export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function error(code: string, message: string, status = 400): Response {
  return json({ error: { code, message } }, status);
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

export async function parseJsonBody<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("idempotency-key")?.trim() || null;
}

export function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = origin ?? "*";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "Authorization,Content-Type,Idempotency-Key",
    "access-control-max-age": "86400",
  };
}
