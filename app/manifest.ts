import type { MetadataRoute } from "next";
import { marketingUrl } from "@/lib/site-urls";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manut",
    short_name: "Manut",
    description:
      "Issue tracker for product teams — issues, kanban boards, cycles, and an AI agent in one keyboard-first workspace.",
    start_url: marketingUrl("/"),
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/manut-logo.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
