import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactCompiler: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "posthog-js"],
    // Cache soft-navigated RSC payloads client-side (repeat visits feel instant).
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  async rewrites() {
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    const assetsHost = host.replace(
      "https://us.i.posthog.com",
      "https://us-assets.i.posthog.com",
    );
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${assetsHost}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${assetsHost}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${host}/:path*`,
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
