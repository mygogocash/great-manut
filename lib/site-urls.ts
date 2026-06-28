/** Production host split: marketing on manut.xyz, app on app.manut.xyz */
export const APP_HOST = "app.manut.xyz";
export const MARKETING_HOSTS = ["manut.xyz", "www.manut.xyz"] as const;

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.manut.xyz";
const MARKETING_ORIGIN =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://manut.xyz";

function isLocalHost(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }
  return false;
}

function joinOrigin(origin: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/** Absolute URL to the customer app (sign-in, workspace, onboarding). */
export function appUrl(path: string): string {
  if (isLocalHost() && !process.env.NEXT_PUBLIC_APP_URL) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return joinOrigin(APP_ORIGIN, path);
}

/** Absolute URL to the marketing site (landing, pricing). */
export function marketingUrl(path: string): string {
  if (isLocalHost() && !process.env.NEXT_PUBLIC_MARKETING_URL) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return joinOrigin(MARKETING_ORIGIN, path);
}

export function isMarketingPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/pricing");
}

export function isAppPath(pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return false;
  }
  return !isMarketingPath(pathname);
}
