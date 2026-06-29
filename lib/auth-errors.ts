/** Map Convex/auth failures to user-facing copy. */
export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Authentication failed";

  if (
    raw.includes("Could not find public function") &&
    raw.includes("auth:signIn")
  ) {
    return "Sign-in is temporarily unavailable — the Convex backend has not been deployed yet. Run pnpm deploy:convex.";
  }

  if (raw.includes("InvalidAccountId") || raw.includes("InvalidSecret")) {
    return "Invalid email or password.";
  }

  if (
    raw.includes("OAuthAccountNotLinked") ||
    raw.includes("account is already associated")
  ) {
    return "This email is already linked to another sign-in method. Try signing in with email instead.";
  }

  if (
    raw.includes("OAuthSignin") ||
    raw.includes("OAuthCallback") ||
    raw.includes("OAuthCreateAccount")
  ) {
    return "Sign-in with that provider failed. Please try again or use email.";
  }

  if (raw.includes("AccessDenied") || raw.includes("access_denied")) {
    return "Sign-in was cancelled or denied. Please try again.";
  }

  if (raw.includes("Configuration") || raw.includes("provider is not configured")) {
    return "Social sign-in is not configured yet. Use email or contact support.";
  }

  return raw;
}
