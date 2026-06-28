import type { MetadataRoute } from "next";
import { marketingUrl } from "@/lib/site-urls";

const AI_CRAWLER_PATHS = ["/", "/pricing", "/llms.txt", "/llms-full.txt"];

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: AI_CRAWLER_PATHS,
      })),
    ],
    sitemap: marketingUrl("/sitemap.xml"),
    host: marketingUrl("/"),
  };
}
