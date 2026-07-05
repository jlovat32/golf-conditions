import type { ScoredHour, TeeTimeWindow } from "@/lib/scoring";
import { scoreLabel } from "@/lib/scoring";
import ShareButton from "@/components/ShareButton";

function formatHour(time: string) {
  const d = new Date(time);
  const weekday = d.toLocaleDateString([], { weekday: "short" });
  const hour = d.toLocaleTimeString([], { hour: "numeric" });
  return `${weekday} ${hour}`;
}

function scoreColor(score: number) {
  if (score >= 8.5) return "text-fairway-600";
  if (score >= 7) return "text-fairway-500";
  if (score >= 5) return "text-sand-300";
  return "text-red-500";
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
  return (
    <div className="rounded-2xl border border-fairway-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-fairway-500">Current conditions</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-semibold ${scoreColor(current.score)}`}>
              {current.score.toFixed(1)}
            </span>
            <span className="text-lg text-fairway-400">/ 10</span>
            <span className="ml-1 rounded-full bg-fairway-50 px-3 py-1 text-sm font-medium text-fairway-700">
              {scoreLabel(current.score)}
            </span>
          </div>
        </div>
        <ShareButton
          title={`${courseName}: ${current.score.toFixed(1)}/10 (${scoreLabel(current.score)}) conditions`}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm text-fairway-700">
        <div>
          <dt className="text-fairway-400">Temp</dt>
          <dd className="font-medium">{Math.round(current.tempF)}°F</dd>
        </div>
        <div>
          <dt className="text-fairway-400">Wind</dt>
          <dd className="font-medium">{Math.round(current.windMph)} mph</dd>
        </div>
        <div>
          <dt className="text-fairway-400">Rain chance</dt>
          <dd className="font-medium">{Math.round(current.precipProbability)}%</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-fairway-50 pt-4">
        <p className="text-sm font-medium text-fairway-500">Best tee time windows</p>
        {windows.length === 0 ? (
          <p className="mt-1 text-sm text-fairway-400">
            No standout windows in the forecast right now.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {windows.map((window) => (
              <li
                key={window.start}
                className="flex items-center justify-between rounded-lg bg-fairway-50 px-3 py-2 text-sm text-fairway-800"
              >
                <span>
                  {formatHour(window.start)} – {formatHour(window.end)}
                </span>
                <span className="font-medium text-fairway-600">{window.avgScore.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
