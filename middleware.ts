import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  APP_HOST,
  MARKETING_HOSTS,
  isAppPath,
  isMarketingPath,
} from "@/lib/site-urls";

const MARKETING_ORIGIN = "https://manut.xyz";
const APP_ORIGIN = "https://app.manut.xyz";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/ingest(.*)",
]);

function hostBasedRedirect(
  request: NextRequest,
  isAuthenticated: boolean,
): NextResponse | null {
  const host = request.nextUrl.hostname;

  if (host === "www.manut.xyz") {
    const url = request.nextUrl.clone();
    url.hostname = "manut.xyz";
    return NextResponse.redirect(url, 308);
  }

  if (host === "www.app.manut.xyz") {
    const url = request.nextUrl.clone();
    url.hostname = APP_HOST;
    return NextResponse.redirect(url, 308);
  }

  if ((MARKETING_HOSTS as readonly string[]).includes(host)) {
    if (isAppPath(request.nextUrl.pathname)) {
      const url = new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        APP_ORIGIN,
      );
      return NextResponse.redirect(url, 308);
    }
    return null;
  }

  if (host === APP_HOST) {
    const { pathname, search } = request.nextUrl;
    if (isMarketingPath(pathname)) {
      if (pathname === "/") {
        const dest = isAuthenticated ? "/onboarding" : "/sign-in";
        return NextResponse.redirect(new URL(`${dest}${search}`, APP_ORIGIN), 307);
      }
      return NextResponse.redirect(
        new URL(`${pathname}${search}`, MARKETING_ORIGIN),
        308,
      );
    }
  }

  return null;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();
  const redirect = hostBasedRedirect(request, isAuthenticated);
  if (redirect) {
    return redirect;
  }

  if (!isPublicRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  matcher: [
    "/((?!_next|ingest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
