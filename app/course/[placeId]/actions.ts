"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

export async function saveFavorite(formData: FormData) {
  const placeId = String(formData.get("placeId") ?? "");
  const name = String(formData.get("name") ?? "");
  const address = String(formData.get("address") ?? "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!placeId || !name) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { place_id: placeId, name, address, lat, lng },
      { onConflict: "place_id" }
    );

  if (error) {
    throw new Error(`Failed to save favorite: ${error.message}`);
  }

  revalidatePath("/favorites");
}
