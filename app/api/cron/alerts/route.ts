import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getHourlyForecast, type HourlyWeather } from "@/lib/weather";
import { scoreHourly, bestTeeTimeWindows, scoreHour } from "@/lib/scoring";
import { sendConditionAlert, sendConditionDropAlert } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";

const REALERT_COOLDOWN_HOURS = 12;
const PLANNED_ROUND_WINDOW_HOURS = 24;

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

type PlannedRoundRow = {
  id: string;
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  email: string;
  tee_time: string;
  alert_threshold: number;
  unsubscribe_token: string | null;
};

type Result = { kind: "favorite" | "planned"; id: string; status: string; detail?: string };

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function shouldAlertFavorite(favorite: FavoriteRow, score: number): boolean {
  if (score < favorite.alert_threshold) return false;
  if (!favorite.last_alerted_at) return true;
  const lastMs = new Date(favorite.last_alerted_at).getTime();
  const ageHours = (Date.now() - lastMs) / (1000 * 60 * 60);
  return ageHours >= REALERT_COOLDOWN_HOURS;
}

// Find the forecast hour closest to a target time.
function findHourAt(hourly: HourlyWeather[], target: Date): HourlyWeather | null {
  if (hourly.length === 0) return null;
  let best = hourly[0];
  let bestDelta = Math.abs(new Date(best.time).getTime() - target.getTime());
  for (const h of hourly) {
    const delta = Math.abs(new Date(h.time).getTime() - target.getTime());
    if (delta < bestDelta) {
      bestDelta = delta;
      best = h;
    }
  }
  return best;
}

async function processFavorites(
  supabase: SupabaseClient,
  appUrl: string,
  results: Result[]
) {
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("place_id, name, lat, lng, email, alert_threshold, unsubscribe_token, last_alerted_at")
    .not("email", "is", null);

  if (error) {
    results.push({ kind: "favorite", id: "-", status: "query-error", detail: error.message });
    return;
  }

  for (const favorite of (favorites ?? []) as FavoriteRow[]) {
    if (favorite.lat == null || favorite.lng == null) {
      results.push({ kind: "favorite", id: favorite.place_id, status: "skipped-no-coords" });
      continue;
    }

    try {
      const hourly = await getHourlyForecast(favorite.lat, favorite.lng);
      const scored = scoreHourly(hourly.slice(0, 24));
      if (scored.length === 0) {
        results.push({ kind: "favorite", id: favorite.place_id, status: "skipped-no-forecast" });
        continue;
      }

      const current = scored[0];
      if (!shouldAlertFavorite(favorite, current.score)) {
        results.push({ kind: "favorite", id: favorite.place_id, status: "no-alert-needed" });
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

      results.push({ kind: "favorite", id: favorite.place_id, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ kind: "favorite", id: favorite.place_id, status: "error", detail: message });
    }
  }
}

async function processPlannedRounds(
  supabase: SupabaseClient,
  appUrl: string,
  results: Result[]
) {
  const now = Date.now();
  const windowEnd = new Date(now + PLANNED_ROUND_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: rounds, error } = await supabase
    .from("planned_rounds")
    .select("id, place_id, name, lat, lng, email, tee_time, alert_threshold, unsubscribe_token")
    .is("notified_at", null)
    .gte("tee_time", new Date(now).toISOString())
    .lte("tee_time", windowEnd);

  if (error) {
    results.push({ kind: "planned", id: "-", status: "query-error", detail: error.message });
    return;
  }

  for (const round of (rounds ?? []) as PlannedRoundRow[]) {
    try {
      const teeTime = new Date(round.tee_time);
      const hourly = await getHourlyForecast(round.lat, round.lng);
      const teeHour = findHourAt(hourly, teeTime);
      if (!teeHour) {
        results.push({ kind: "planned", id: round.id, status: "skipped-no-forecast" });
        continue;
      }

      const score = scoreHour(teeHour);
      if (score >= round.alert_threshold) {
        results.push({ kind: "planned", id: round.id, status: "conditions-still-ok" });
        continue;
      }

      const params = new URLSearchParams({
        name: round.name,
        lat: String(round.lat),
        lng: String(round.lng),
      });

      await sendConditionDropAlert({
        to: round.email,
        courseName: round.name,
        teeTime,
        score,
        threshold: round.alert_threshold,
        tempF: teeHour.tempF,
        windMph: teeHour.windMph,
        precipProbability: teeHour.precipProbability,
        courseUrl: `${appUrl}/course/${encodeURIComponent(round.place_id)}?${params.toString()}`,
        unsubscribeUrl: `${appUrl}/api/unsubscribe?token=${round.unsubscribe_token ?? ""}`,
      });

      await supabase
        .from("planned_rounds")
        .update({
          notified_at: new Date().toISOString(),
          notified_score: score,
        })
        .eq("id", round.id);

      results.push({ kind: "planned", id: round.id, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ kind: "planned", id: round.id, status: "error", detail: message });
    }
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const results: Result[] = [];

  await processFavorites(supabase, appUrl, results);
  await processPlannedRounds(supabase, appUrl, results);

  return NextResponse.json({ processed: results.length, results });
}
