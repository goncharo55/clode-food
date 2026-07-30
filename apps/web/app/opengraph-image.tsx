import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff2e6 0%, #f97316 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 160, marginBottom: 20 }}>
          🍔🍩🍣🍛
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#1a1a19" }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#52514e", marginTop: 16 }}>
          今日は何を食べよう？を30秒で。
        </div>
      </div>
    ),
    { ...size },
  );
}
