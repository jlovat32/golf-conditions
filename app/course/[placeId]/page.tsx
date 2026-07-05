import type { Metadata } from "next";
import { getHourlyForecast } from "@/lib/weather";
import { scoreHourly, bestTeeTimeWindows, scoreLabel, type ScoredHour } from "@/lib/scoring";
import { logConditionScore } from "@/lib/history";
import RawWeatherPanel from "@/components/RawWeatherPanel";
import ConditionsCard from "@/components/ConditionsCard";
import BookTeeTimeButton from "@/components/BookTeeTimeButton";
import SaveFavoriteForm from "@/components/SaveFavoriteForm";

type CoursePageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<{ name?: string; address?: string; lat?: string; lng?: string }>;
};

export async function generateMetadata({
  searchParams,
}: CoursePageProps): Promise<Metadata> {
  const { name, lat, lng } = await searchParams;
  const courseName = name ?? "Course";

  let score = "-";
  let label = "";

  if (lat && lng) {
    try {
      const hourly = await getHourlyForecast(Number(lat), Number(lng));
      const scored = scoreHourly(hourly.slice(0, 24));
      if (scored.length > 0) {
        score = scored[0].score.toFixed(1);
        label = scoreLabel(scored[0].score);
      }
    } catch {
      // OG image falls back to placeholder score when weather isn't available
    }
  }

  const ogParams = new URLSearchParams({ name: courseName, score, label });

  return {
    title: `${courseName} — Rain Check`,
    openGraph: {
      title: `${courseName} conditions`,
      images: [`/api/og?${ogParams.toString()}`],
    },
  };
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { placeId } = await params;
  const { name, address, lat, lng } = await searchParams;

  let scored: ScoredHour[] = [];
  let weatherError: string | null = null;

  if (lat && lng) {
    try {
      const hourly = await getHourlyForecast(Number(lat), Number(lng));
      scored = scoreHourly(hourly.slice(0, 24));
    } catch (error) {
      weatherError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  if (scored.length > 0) {
    try {
      await logConditionScore(placeId, scored[0]);
    } catch {
      // Supabase not configured yet — condition history logging is best-effort.
    }
  }

  const windows = scored.length > 0 ? bestTeeTimeWindows(scored) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fairway-900">{name ?? "Course"}</h1>
          {address && <p className="text-fairway-600">{address}</p>}
        </div>
        <SaveFavoriteForm
          placeId={placeId}
          name={name ?? ""}
          address={address ?? ""}
          lat={lat ?? ""}
          lng={lng ?? ""}
        />
      </div>

      <p className="text-sm text-fairway-400">
        Place ID: {placeId}
        {lat && lng ? ` · (${lat}, ${lng})` : ""}
      </p>

      {weatherError && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{weatherError}</p>
      )}

      {scored.length > 0 && (
        <div className="mt-2 flex flex-col gap-4">
          <ConditionsCard current={scored[0]} windows={windows} courseName={name ?? "Course"} />
          <BookTeeTimeButton
            courseName={name ?? "Course"}
            placeId={placeId}
            score={scored[0].score}
          />
          <RawWeatherPanel hourly={scored} />
        </div>
      )}
    </main>
  );
}
