/** Map Convex/auth failures to user-facing copy. */
export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Authentication failed";

  if (
    raw.includes("Could not find public function") &&
    raw.includes("auth:signIn")
  ) {
    return "Sign-in is temporarily unavailable — the Convex backend has not been deployed yet. An admin needs to run pnpm deploy:convex (requires access to modest-schnauzer-996 or CONVEX_DEPLOY_KEY in CI).";
  }

  if (raw.includes("InvalidAccountId") || raw.includes("InvalidSecret")) {
    return "Invalid email or password.";
  }

  return raw;
}
