import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") ?? "Golf Course";
  const score = searchParams.get("score") ?? "-";
  const label = searchParams.get("label") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f6f8f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: "#2f6e2b", marginBottom: 16 }}>
          ⛳ Golf Conditions
        </div>
        <div style={{ display: "flex", fontSize: 48, color: "#1c391b", fontWeight: 700 }}>
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 24 }}>
          <div style={{ display: "flex", fontSize: 120, color: "#3f8a38", fontWeight: 700 }}>
            {score}
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#5da755", marginLeft: 12 }}>
            / 10 {label}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
