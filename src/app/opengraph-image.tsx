import { ImageResponse } from "next/og";

export const alt = "AVARIS — Storytelling is Everything.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(40,46,58,0.85) 0%, rgba(10,13,18,1) 70%), #0A0D12",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "flex", marginBottom: 40 }}
        >
          <circle cx="50" cy="50" r="46" stroke="#FFFFFF" strokeWidth="3" />
          <path
            d="M 26 76 L 50 24 L 74 76"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
          <path
            d="M 36 60 L 64 60"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <path d="M 41 53 L 45 49 L 49 53 L 45 57 Z" fill="#FFFFFF" />
          <path d="M 51 53 L 55 49 L 59 53 L 55 57 Z" fill="#FFFFFF" />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          AVARIS
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            marginTop: 28,
            color: "#B8B8B8",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Storytelling is Everything.
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 60,
            fontSize: 18,
            color: "#808080",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Premium Media Production · Est. 2020
        </div>
      </div>
    ),
    { ...size },
  );
}
