import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    prefix: "affiliate-click",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.partner !== "string") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("affiliate_clicks").insert({
      partner: body.partner,
      place_id: body.placeId ?? null,
      course_name: body.courseName ?? null,
      score: typeof body.score === "number" ? body.score : null,
    });

    if (error) {
      console.error("affiliate_clicks insert failed:", error.message);
    }
  } catch {
    // Supabase not configured or unreachable — click tracking is best-effort.
  }

  return NextResponse.json({ ok: true });
}
