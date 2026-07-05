import { getSupabaseClient } from "@/lib/supabase";
import type { ScoredHour } from "@/lib/scoring";

export async function logConditionScore(placeId: string, current: ScoredHour): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("condition_history").insert({
    place_id: placeId,
    score: current.score,
    temp_f: current.tempF,
    wind_mph: current.windMph,
    precip_probability: current.precipProbability,
  });

  if (error) {
    console.error("Failed to log condition history:", error.message);
  }
}

export async function getLatestScore(placeId: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("condition_history")
    .select("score")
    .eq("place_id", placeId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return Number(data.score);
}
