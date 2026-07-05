import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { getLatestScore } from "@/lib/history";
import { scoreLabel } from "@/lib/scoring";

type Favorite = {
  place_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
  alert_threshold: number | null;
};

export default async function FavoritesPage() {
  let favorites: Favorite[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseClient();
    const { data, error: queryError } = await supabase
      .from("favorites")
      .select("place_id, name, address, lat, lng, email, alert_threshold")
      .order("created_at", { ascending: false });

    if (queryError) throw new Error(queryError.message);
    favorites = data ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  const withScores = await Promise.all(
    favorites.map(async (favorite) => ({
      ...favorite,
      score: await getLatestScore(favorite.place_id).catch(() => null),
    }))
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-fairway-900">Favorite courses</h1>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!error && withScores.length === 0 && (
        <p className="text-fairway-500">
          No favorites yet. Search for a course and save it to see it here.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {withScores.map((favorite) => {
          const params = new URLSearchParams({
            name: favorite.name,
            address: favorite.address ?? "",
            lat: String(favorite.lat ?? ""),
            lng: String(favorite.lng ?? ""),
          });

          return (
            <li key={favorite.place_id}>
              <Link
                href={`/course/${encodeURIComponent(favorite.place_id)}?${params.toString()}`}
                className="flex items-center justify-between rounded-2xl border border-fairway-100 bg-white p-4 transition-colors hover:bg-fairway-50"
              >
                <div>
                  <p className="font-medium text-fairway-900">{favorite.name}</p>
                  {favorite.address && (
                    <p className="text-sm text-fairway-500">{favorite.address}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {favorite.score != null && (
                    <span className="rounded-full bg-fairway-50 px-3 py-1 text-sm font-medium text-fairway-700">
                      {favorite.score.toFixed(1)} · {scoreLabel(favorite.score)}
                    </span>
                  )}
                  {favorite.email && (
                    <span className="text-xs text-fairway-500">
                      🔔 Alerts at ≥{Number(favorite.alert_threshold ?? 8).toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
