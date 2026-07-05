import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getHourlyForecast } from "@/lib/weather";
import { scoreHourly, bestTeeTimeWindows } from "@/lib/scoring";
import { sendConditionAlert } from "@/lib/email";

const REALERT_COOLDOWN_HOURS = 12;

type FavoriteRow = {
  place_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  email: string;
  alert_threshold: number;
  unsubscribe_token: string | null;
  last_alerted_at: string | null;
};

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — allow (dev)
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function shouldAlert(favorite: FavoriteRow, score: number): boolean {
  if (score < favorite.alert_threshold) return false;
  if (!favorite.last_alerted_at) return true;
  const lastMs = new Date(favorite.last_alerted_at).getTime();
  const ageHours = (Date.now() - lastMs) / (1000 * 60 * 60);
  return ageHours >= REALERT_COOLDOWN_HOURS;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: favorites, error: queryError } = await supabase
    .from("favorites")
    .select("place_id, name, lat, lng, email, alert_threshold, unsubscribe_token, last_alerted_at")
    .not("email", "is", null);

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const results: Array<{ placeId: string; status: string; detail?: string }> = [];

  for (const favorite of (favorites ?? []) as FavoriteRow[]) {
    if (favorite.lat == null || favorite.lng == null) {
      results.push({ placeId: favorite.place_id, status: "skipped-no-coords" });
      continue;
    }

    try {
      const hourly = await getHourlyForecast(favorite.lat, favorite.lng);
      const scored = scoreHourly(hourly.slice(0, 24));
      if (scored.length === 0) {
        results.push({ placeId: favorite.place_id, status: "skipped-no-forecast" });
        continue;
      }

      const current = scored[0];
      if (!shouldAlert(favorite, current.score)) {
        results.push({ placeId: favorite.place_id, status: "no-alert-needed" });
        continue;
      }

      const windows = bestTeeTimeWindows(scored);
      const params = new URLSearchParams({
        name: favorite.name,
        lat: String(favorite.lat),
        lng: String(favorite.lng),
      });

      await sendConditionAlert({
        to: favorite.email,
        courseName: favorite.name,
        current,
        windows,
        courseUrl: `${appUrl}/course/${encodeURIComponent(favorite.place_id)}?${params.toString()}`,
        unsubscribeUrl: `${appUrl}/api/unsubscribe?token=${favorite.unsubscribe_token ?? ""}`,
      });

      await supabase
        .from("favorites")
        .update({
          last_alerted_at: new Date().toISOString(),
          last_alerted_score: current.score,
        })
        .eq("place_id", favorite.place_id);

      results.push({ placeId: favorite.place_id, status: "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ placeId: favorite.place_id, status: "error", detail: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
