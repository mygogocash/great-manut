import type { MetadataRoute } from "next";
import { marketingUrl } from "@/lib/site-urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: marketingUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: marketingUrl("/pricing"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
