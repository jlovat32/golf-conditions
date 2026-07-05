import type { HourlyWeather } from "@/lib/weather";

function formatHour(time: string) {
  return new Date(time).toLocaleTimeString([], { hour: "numeric" });
}

export default function RawWeatherPanel({ hourly }: { hourly: HourlyWeather[] }) {
  if (hourly.length === 0) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-fairway-100 bg-white p-4">
      <summary className="cursor-pointer text-sm font-medium text-fairway-600">
        Raw hourly forecast
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="text-fairway-500">
              <th className="pb-2 pr-4 font-medium">Time</th>
              <th className="pb-2 pr-4 font-medium">Temp</th>
              <th className="pb-2 pr-4 font-medium">Wind</th>
              <th className="pb-2 font-medium">Rain chance</th>
            </tr>
          </thead>
          <tbody>
            {hourly.slice(0, 24).map((hour) => (
              <tr key={hour.time} className="border-t border-fairway-50 text-fairway-800">
                <td className="py-1.5 pr-4">{formatHour(hour.time)}</td>
                <td className="py-1.5 pr-4">{Math.round(hour.tempF)}°F</td>
                <td className="py-1.5 pr-4">{Math.round(hour.windMph)} mph</td>
                <td className="py-1.5">{Math.round(hour.precipProbability)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
