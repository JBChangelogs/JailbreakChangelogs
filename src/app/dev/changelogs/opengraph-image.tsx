import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Development Changelog";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121317",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #333",
          borderRadius: "20px",
          padding: "40px",
          backgroundColor: "#1c1d22",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 20,
            background: "linear-gradient(to right, #ffffff, #888888)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Development Changelog
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#aaaaaa",
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          Track all development changes, updates, and improvements made to the
          website.
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2462cd",
            padding: "10px 30px",
            borderRadius: "50px",
            fontSize: 20,
            fontWeight: 600,
            color: "white",
          }}
        >
          Jailbreak Changelogs
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
