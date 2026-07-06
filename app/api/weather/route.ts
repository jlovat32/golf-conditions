import { NextRequest, NextResponse } from "next/server";
import { getHourlyForecast } from "@/lib/weather";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, {
    prefix: "weather",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required" }, { status: 400 });
  }

  try {
    const hourly = await getHourlyForecast(lat, lng);
    return NextResponse.json({ hourly });
  } catch (error) {
    console.error("Weather fetch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
