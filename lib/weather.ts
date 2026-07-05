export type HourlyWeather = {
  time: string;
  tempF: number;
  windMph: number;
  precipProbability: number;
};

const TOMORROW_FORECAST_URL = "https://api.tomorrow.io/v4/weather/forecast";

type TomorrowHourlyEntry = {
  time: string;
  values: {
    temperature?: number;
    windSpeed?: number;
    precipitationProbability?: number;
  };
};

type TomorrowForecastResponse = {
  timelines?: {
    hourly?: TomorrowHourlyEntry[];
  };
};

export async function getHourlyForecast(lat: number, lng: number): Promise<HourlyWeather[]> {
  const apiKey = process.env.TOMORROW_IO_API_KEY;
  if (!apiKey) {
    throw new Error("TOMORROW_IO_API_KEY is not set");
  }

  const url = `${TOMORROW_FORECAST_URL}?location=${lat},${lng}&units=imperial&apikey=${apiKey}`;

  const res = await fetch(url, {
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tomorrow.io forecast failed (${res.status}): ${body}`);
  }

  const data: TomorrowForecastResponse = await res.json();
  const hourly = data.timelines?.hourly ?? [];

  return hourly.map((entry) => ({
    time: entry.time,
    tempF: entry.values.temperature ?? 0,
    windMph: entry.values.windSpeed ?? 0,
    precipProbability: entry.values.precipitationProbability ?? 0,
  }));
}
