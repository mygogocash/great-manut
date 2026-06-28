import { buildLlmsFullTxt } from "@/lib/product-facts";

export function GET() {
  const lastUpdated = new Date().toISOString().slice(0, 10);

  return new Response(buildLlmsFullTxt(lastUpdated), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
