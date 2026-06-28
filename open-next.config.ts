import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
  ...defineCloudflareConfig(),
  // OpenNext defaults to `pnpm run build`; point it at Next directly to avoid
  // recursion when the package "build" script is opennextjs-cloudflare build.
  buildCommand: "next build",
};

export default openNextConfig;
