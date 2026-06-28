import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // OpenNext defaults to `pnpm run build`; point it at Next directly to avoid
  // recursion when the package "build" script is opennextjs-cloudflare build.
  buildCommand: "next build",
};
