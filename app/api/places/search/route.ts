import { NextRequest, NextResponse } from "next/server";
import { searchGolfCourses } from "@/lib/places";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, {
    prefix: "places-search",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchGolfCourses(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
