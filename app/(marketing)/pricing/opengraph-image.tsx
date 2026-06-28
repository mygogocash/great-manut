import { ImageResponse } from "next/og";

export const alt = "Manut pricing — Plans from $0";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PricingOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(145deg, #09090b 0%, #18181b 55%, #27272a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 24, color: "#a1a1aa", marginBottom: 16 }}>
          Manut · Pricing
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Plans from $0
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#a1a1aa",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Free for 3 teammates · Pro with AI from $20/mo · Enterprise at $99/mo
        </div>
      </div>
    ),
    { ...size }
  );
}
