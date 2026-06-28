import { ImageResponse } from "next/og";

export const alt = "Manut — Issue tracker built for speed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#fafafa",
            }}
          />
          <span style={{ fontSize: 36, fontWeight: 600 }}>Manut</span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: 900,
          }}
        >
          The issue tracker built for speed
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#a1a1aa",
            maxWidth: 780,
            lineHeight: 1.4,
          }}
        >
          Issues, kanban boards, cycles, and an AI agent — free for teams of 3.
        </div>
      </div>
    ),
    { ...size }
  );
}
