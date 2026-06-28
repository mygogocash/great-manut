/** Map Convex/auth failures to user-facing copy. */
export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Authentication failed";

  if (
    raw.includes("Could not find public function") &&
    raw.includes("auth:signIn")
  ) {
    return "Sign-in is temporarily unavailable — the backend has not been deployed yet. Ask your admin to run ./scripts/deploy-convex.sh.";
  }

  if (raw.includes("InvalidAccountId") || raw.includes("InvalidSecret")) {
    return "Invalid email or password.";
  }

  return raw;
}
