import type { ScoredHour, TeeTimeWindow } from "@/lib/scoring";
import { scoreLabel } from "@/lib/scoring";
import ShareButton from "@/components/ShareButton";

function formatHour(time: string) {
  const d = new Date(time);
  const weekday = d.toLocaleDateString([], { weekday: "short" });
  const hour = d.toLocaleTimeString([], { hour: "numeric" });
  return `${weekday} ${hour}`;
}

function scoreEmoji(score: number) {
  if (score >= 8.5) return "☀️";
  if (score >= 7) return "⛅";
  if (score >= 5) return "🌥️";
  return "🌧️";
}

function scoreRingClasses(score: number) {
  if (score >= 8.5)
    return "bg-gradient-to-br from-fairway-400 to-fairway-600 text-white shadow-fairway-300/50";
  if (score >= 7)
    return "bg-gradient-to-br from-sun-300 to-fairway-400 text-white shadow-sun-300/50";
  if (score >= 5)
    return "bg-gradient-to-br from-sun-300 to-sun-500 text-white shadow-sun-300/50";
  return "bg-gradient-to-br from-sky-300 to-sky-500 text-white shadow-sky-300/50";
}

export default function ConditionsCard({
  current,
  windows,
  courseName,
}: {
  current: ScoredHour;
  windows: TeeTimeWindow[];
  courseName: string;
}) {
  const label = scoreLabel(current.score);
  const emoji = scoreEmoji(current.score);

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-fairway-200/40 backdrop-blur-sm sm:p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full shadow-xl ${scoreRingClasses(current.score)}`}
          >
            <span className="font-display text-4xl font-bold">
              {current.score.toFixed(1)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-fairway-500">
              Right now
            </p>
            <p className="font-display text-3xl font-semibold text-fairway-900">
              {emoji} {label}
            </p>
          </div>
        </div>
        <ShareButton
          courseName={courseName}
          score={current.score}
          label={label}
        />
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-fairway-50 px-3 py-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-fairway-500">
            Temp
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold text-fairway-900">
            {Math.round(current.tempF)}°
          </dd>
        </div>
        <div className="rounded-2xl bg-sky-100 px-3 py-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-sky-500">
            Wind
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold text-fairway-900">
            {Math.round(current.windMph)}
            <span className="text-sm text-fairway-500"> mph</span>
          </dd>
        </div>
        <div className="rounded-2xl bg-sun-100 px-3 py-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-sun-500">
            Rain
          </dt>
          <dd className="mt-1 font-display text-2xl font-semibold text-fairway-900">
            {Math.round(current.precipProbability)}%
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-fairway-500">
          ⏰ Best tee times
        </p>
        {windows.length === 0 ? (
          <p className="rounded-2xl bg-fairway-50 px-4 py-3 text-sm text-fairway-500">
            No standout windows in the next 24 hours.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {windows.map((window) => (
              <li
                key={window.start}
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-fairway-100 to-fairway-50 px-4 py-3"
              >
                <span className="font-medium text-fairway-900">
                  {formatHour(window.start)} – {formatHour(window.end)}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 font-display text-sm font-semibold text-fairway-700">
                  {window.avgScore.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
