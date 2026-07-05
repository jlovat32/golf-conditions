"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

export async function saveFavorite(formData: FormData) {
  const placeId = String(formData.get("placeId") ?? "");
  const name = String(formData.get("name") ?? "");
  const address = String(formData.get("address") ?? "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const emailRaw = String(formData.get("email") ?? "").trim();
  const thresholdRaw = formData.get("alertThreshold");
  const alertThreshold = thresholdRaw ? Number(thresholdRaw) : null;

  if (!placeId || !name) return;

  const record: Record<string, unknown> = { place_id: placeId, name, address, lat, lng };
  if (emailRaw) {
    record.email = emailRaw;
    if (alertThreshold != null && alertThreshold >= 1 && alertThreshold <= 10) {
      record.alert_threshold = alertThreshold;
    }
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("favorites")
    .upsert(record, { onConflict: "place_id" });

  if (error) {
    throw new Error(`Failed to save favorite: ${error.message}`);
  }

  revalidatePath("/favorites");
}
