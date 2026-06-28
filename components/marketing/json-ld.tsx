import { buildLandingJsonLd, buildPricingJsonLd } from "@/lib/seo";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={`${String(graph["@type"] ?? "schema")}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
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
