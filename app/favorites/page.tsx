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

function scoreColor(score: number): string {
  if (score >= 8.5) return "bg-gradient-to-br from-fairway-400 to-fairway-600";
  if (score >= 7) return "bg-gradient-to-br from-sun-300 to-fairway-400";
  if (score >= 5) return "bg-gradient-to-br from-sun-300 to-sun-500";
  return "bg-gradient-to-br from-sky-300 to-sky-500";
}

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <h1 className="font-display text-4xl font-semibold text-fairway-900">
          ⭐ Your favorites
        </h1>
        <p className="mt-2 text-fairway-600">
          Saved courses with their latest condition scores.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {!error && withScores.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-fairway-200 bg-white/50 px-6 py-12 text-center">
          <div className="text-5xl">🏌️</div>
          <p className="mt-4 font-display text-lg font-semibold text-fairway-800">
            No favorites yet
          </p>
          <p className="mt-1 text-sm text-fairway-500">
            Search a course, then hit &quot;Save & get alerts&quot; to see it here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-fairway-600 px-5 py-2.5 font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            Search courses →
          </Link>
        </div>
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
                className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-fairway-100/40 transition-transform hover:scale-[1.01]"
              >
                {favorite.score != null ? (
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-md ${scoreColor(favorite.score)}`}
                  >
                    <span className="font-display text-xl font-bold">
                      {favorite.score.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-fairway-100 text-2xl">
                    ⛳
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-fairway-900">
                    {favorite.name}
                  </p>
                  {favorite.address && (
                    <p className="truncate text-sm text-fairway-500">{favorite.address}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-fairway-500">
                    {favorite.score != null && (
                      <span className="rounded-full bg-fairway-50 px-2 py-0.5 font-medium">
                        {scoreLabel(favorite.score)}
                      </span>
                    )}
                    {favorite.email && (
                      <span>🔔 Alerts at ≥{Number(favorite.alert_threshold ?? 8).toFixed(1)}</span>
                    )}
                  </div>
                </div>

                <span className="text-fairway-400">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
