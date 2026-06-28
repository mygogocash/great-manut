import { buildLandingJsonLd, buildPricingJsonLd } from "@/lib/seo";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Prevent `</script>` in string values from breaking the JSON-LD block. */
function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/<\//g, "<\\/");
}

export function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={`${String(graph["@type"] ?? "schema")}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(graph) }}
        />
      ))}
    </>
  );
}

export function LandingJsonLd() {
  return <JsonLd data={buildLandingJsonLd()} />;
}

export function PricingJsonLd() {
  return <JsonLd data={buildPricingJsonLd()} />;
}
