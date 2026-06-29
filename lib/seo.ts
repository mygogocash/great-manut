import type { Metadata } from "next";
import {
  CONTACT_EMAIL,
  ENTITY_TRIPLE,
  FAQ_ITEMS,
  PRODUCT_DEFINITION,
  PRODUCT_FEATURES,
  PRODUCT_URLS,
} from "@/lib/product-facts";
import {
  BUSINESS_PLAN_DEF,
  FREE_PLAN,
} from "@/lib/plans";
import { marketingUrl } from "@/lib/site-urls";

export const SITE_NAME = "Manut";

export const metadataBase = new URL(
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://manut.xyz"
);

export const marketingOpenGraphDefaults: Metadata["openGraph"] = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
};

export const marketingTwitterDefaults: Metadata["twitter"] = {
  card: "summary_large_image",
  images: ["/twitter-image"],
};

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
};

/** Per-page metadata with canonical, OG, and Twitter defaults. */
export function buildPageMetadata({
  title,
  description,
  path,
  openGraphTitle,
  openGraphDescription,
}: BuildPageMetadataOptions): Metadata {
  const canonical = marketingUrl(path);
  const ogTitle = openGraphTitle ?? title;
  const ogDescription = openGraphDescription ?? description;
  const useSegmentOgImages = path === "/pricing";

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    ...marketingOpenGraphDefaults,
    title: ogTitle,
    description: ogDescription,
    url: canonical,
  };
  if (useSegmentOgImages) {
    delete openGraph.images;
  }

  const twitter: NonNullable<Metadata["twitter"]> = {
    ...marketingTwitterDefaults,
    title: ogTitle,
    description: ogDescription,
  };
  if (useSegmentOgImages) {
    delete twitter.images;
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      types: {
        "text/plain": [{ url: "/llms.txt", title: "llms.txt" }],
      },
    },
    openGraph,
    twitter,
    robots: {
      index: true,
      follow: true,
    },
  };
}

type JsonLd = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ENTITY_TRIPLE.product,
    url: PRODUCT_URLS.marketing,
    logo: marketingUrl("/manut-logo.webp"),
    email: CONTACT_EMAIL,
    description: PRODUCT_DEFINITION,
  };
}

export function buildWebSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: PRODUCT_URLS.marketing,
    description: PRODUCT_DEFINITION,
    publisher: {
      "@type": "Organization",
      name: ENTITY_TRIPLE.product,
    },
  };
}

export function buildSoftwareApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: ENTITY_TRIPLE.product,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: PRODUCT_URLS.marketing,
    description: PRODUCT_DEFINITION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      url: PRODUCT_URLS.pricing,
    },
    featureList: PRODUCT_FEATURES.map((f) => f.term).join(", "),
    audience: {
      "@type": "Audience",
      audienceType: ENTITY_TRIPLE.audience,
    },
  };
}

export function buildFaqPageJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildSpeakableJsonLd(pageUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} — ${ENTITY_TRIPLE.category}`,
    url: pageUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero-headline", "#hero-definition", "#faq-answer-0"],
    },
  };
}

export function buildLandingJsonLd(): JsonLd[] {
  return [
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    buildSoftwareApplicationJsonLd(),
    buildFaqPageJsonLd(),
    buildSpeakableJsonLd(PRODUCT_URLS.marketing),
  ];
}

type PricingOffer = {
  name: string;
  price: number;
  description: string;
};

function pricingOffer({ name, price, description }: PricingOffer): JsonLd {
  return {
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: "USD",
    url: PRODUCT_URLS.pricing,
    description,
    availability: "https://schema.org/InStock",
  };
}

export function buildPricingProductJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${ENTITY_TRIPLE.product} workspace plans`,
    description: PRODUCT_DEFINITION,
    brand: {
      "@type": "Brand",
      name: ENTITY_TRIPLE.product,
    },
    url: PRODUCT_URLS.pricing,
    offers: [
      pricingOffer({
        name: FREE_PLAN.name,
        price: FREE_PLAN.monthlyPrice,
        description: FREE_PLAN.tagline,
      }),
      pricingOffer({
        name: BUSINESS_PLAN_DEF.name,
        price: BUSINESS_PLAN_DEF.monthlyPrice,
        description: BUSINESS_PLAN_DEF.tagline,
      }),
    ],
  };
}

export function buildPricingJsonLd(): JsonLd[] {
  return [buildOrganizationJsonLd(), buildPricingProductJsonLd()];
}
