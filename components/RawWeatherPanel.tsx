import type { HourlyWeather } from "@/lib/weather";

function formatHour(time: string) {
  return new Date(time).toLocaleTimeString([], { hour: "numeric" });
}

export default function RawWeatherPanel({ hourly }: { hourly: HourlyWeather[] }) {
  if (hourly.length === 0) {
    return null;
  }

  return (
    <details className="rounded-3xl border border-fairway-100 bg-white/70 p-5 backdrop-blur-sm">
      <summary className="cursor-pointer text-sm font-semibold text-fairway-600 marker:text-fairway-400">
        📊 Hour-by-hour forecast
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider text-fairway-500">
              <th className="pb-2 pr-4">Time</th>
              <th className="pb-2 pr-4">Temp</th>
              <th className="pb-2 pr-4">Wind</th>
              <th className="pb-2">Rain</th>
            </tr>
          </thead>
          <tbody>
            {hourly.slice(0, 24).map((hour) => (
              <tr key={hour.time} className="border-t border-fairway-50 text-fairway-800">
                <td className="py-2 pr-4 font-medium">{formatHour(hour.time)}</td>
                <td className="py-2 pr-4">{Math.round(hour.tempF)}°</td>
                <td className="py-2 pr-4">{Math.round(hour.windMph)} mph</td>
                <td className="py-2">{Math.round(hour.precipProbability)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
