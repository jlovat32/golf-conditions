import type { HourlyWeather } from "@/lib/weather";

export type ScoredHour = HourlyWeather & { score: number };

export type TeeTimeWindow = {
  start: string;
  end: string;
  avgScore: number;
};

const IDEAL_TEMP_LOW = 60;
const IDEAL_TEMP_HIGH = 80;
const MIN_RECOMMENDED_SCORE = 7;

export function scoreHour({ tempF, windMph, precipProbability }: HourlyWeather): number {
  let score = 10;

  if (precipProbability > 70) score -= 3;
  else if (precipProbability >= 40) score -= 1.5;

  if (windMph > 25) score -= 3;
  else if (windMph >= 15) score -= 1.5;

  if (tempF < IDEAL_TEMP_LOW) {
    score -= Math.min(2, ((IDEAL_TEMP_LOW - tempF) / IDEAL_TEMP_LOW) * 2);
  } else if (tempF > IDEAL_TEMP_HIGH) {
    score -= Math.min(2, ((tempF - IDEAL_TEMP_HIGH) / IDEAL_TEMP_HIGH) * 2);
  }

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

export function scoreLabel(score: number): string {
  if (score >= 8.5) return "Great";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  return "Poor";
}

export function scoreHourly(hourly: HourlyWeather[]): ScoredHour[] {
  return hourly.map((hour) => ({ ...hour, score: scoreHour(hour) }));
}

export function bestTeeTimeWindows(scored: ScoredHour[], limit = 2): TeeTimeWindow[] {
  const windows: TeeTimeWindow[] = [];
  let current: ScoredHour[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const avgScore =
      current.reduce((sum, hour) => sum + hour.score, 0) / current.length;
    windows.push({
      start: current[0].time,
      end: current[current.length - 1].time,
      avgScore: Math.round(avgScore * 10) / 10,
    });
    current = [];
  };

  for (const hour of scored) {
    if (hour.score >= MIN_RECOMMENDED_SCORE) {
      current.push(hour);
    } else {
      flush();
    }
  }
  flush();

  return windows.sort((a, b) => b.avgScore - a.avgScore).slice(0, limit);
}
