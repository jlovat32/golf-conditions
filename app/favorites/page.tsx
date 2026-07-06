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

type PlannedRound = {
  id: string;
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  email: string;
  tee_time: string;
  alert_threshold: number;
  notified_at: string | null;
  notified_score: number | null;
};

function scoreColor(score: number): string {
  if (score >= 8.5) return "bg-gradient-to-br from-fairway-400 to-fairway-600";
  if (score >= 7) return "bg-gradient-to-br from-sun-300 to-fairway-400";
  if (score >= 5) return "bg-gradient-to-br from-sun-300 to-sun-500";
  return "bg-gradient-to-br from-sky-300 to-sky-500";
}

function formatTeeTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function FavoritesPage() {
  let favorites: Favorite[] = [];
  let rounds: PlannedRound[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseClient();
    const [favResp, roundResp] = await Promise.all([
      supabase
        .from("favorites")
        .select("place_id, name, address, lat, lng, email, alert_threshold")
        .order("created_at", { ascending: false }),
      supabase
        .from("planned_rounds")
        .select("id, place_id, name, address, lat, lng, email, tee_time, alert_threshold, notified_at, notified_score")
        .gte("tee_time", new Date().toISOString())
        .order("tee_time", { ascending: true }),
    ]);

    if (favResp.error) throw new Error(favResp.error.message);
    if (roundResp.error) throw new Error(roundResp.error.message);

    favorites = favResp.data ?? [];
    rounds = roundResp.data ?? [];
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <h1 className="font-display text-4xl font-semibold text-fairway-900">
          Your dashboard
        </h1>
        <p className="mt-2 text-fairway-600">
          Favorites you're watching and rounds you've planned.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold text-fairway-900">
          📅 Planned rounds
        </h2>

        {rounds.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-sky-200 bg-white/50 px-6 py-8 text-center">
            <p className="text-sm text-fairway-500">
              No upcoming rounds. Plan one from a course page to get alerted if the
              forecast turns.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rounds.map((round) => {
              const params = new URLSearchParams({
                name: round.name,
                address: round.address ?? "",
                lat: String(round.lat),
                lng: String(round.lng),
              });
              return (
                <li key={round.id}>
                  <Link
                    href={`/course/${encodeURIComponent(round.place_id)}?${params.toString()}`}
                    className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-sky-100/40 transition-transform hover:scale-[1.01]"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-300 text-sky-500">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {new Date(round.tee_time).toLocaleDateString([], { weekday: "short" })}
                      </span>
                      <span className="font-display text-lg font-bold">
                        {new Date(round.tee_time).toLocaleTimeString([], { hour: "numeric" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-semibold text-fairway-900">
                        {round.name}
                      </p>
                      <p className="truncate text-sm text-fairway-500">
                        {formatTeeTime(round.tee_time)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-fairway-500">
                        <span>🔔 Warn below {Number(round.alert_threshold).toFixed(1)}</span>
                        {round.notified_at && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600">
                            Alerted at {Number(round.notified_score ?? 0).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-fairway-400">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold text-fairway-900">
          ⭐ Favorite courses
        </h2>

        {withScores.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-fairway-200 bg-white/50 px-6 py-8 text-center">
            <p className="text-sm text-fairway-500">
              No favorites yet. Save a course to get an email when it's playing great.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}
