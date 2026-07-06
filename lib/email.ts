import { Resend } from "resend";
import type { ScoredHour, TeeTimeWindow } from "@/lib/scoring";
import { scoreLabel } from "@/lib/scoring";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Rain Check <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function formatWindow(window: TeeTimeWindow): string {
  const fmt = (t: string) =>
    new Date(t).toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  return `${fmt(window.start)} – ${fmt(window.end)} (avg ${window.avgScore.toFixed(1)})`;
}

export async function sendConditionAlert(params: {
  to: string;
  courseName: string;
  current: ScoredHour;
  windows: TeeTimeWindow[];
  unsubscribeUrl: string;
  courseUrl: string;
}): Promise<void> {
  const { to, courseName, current, windows, unsubscribeUrl, courseUrl } = params;
  const label = scoreLabel(current.score);
  const scoreStr = current.score.toFixed(1);
  const safeName = escapeHtml(courseName);
  const safeCourseUrl = escapeHtml(courseUrl);
  const safeUnsubUrl = escapeHtml(unsubscribeUrl);

  const windowsHtml = windows.length
    ? `<ul>${windows.map((w) => `<li>${escapeHtml(formatWindow(w))}</li>`).join("")}</ul>`
    : "<p><em>No standout windows in the forecast.</em></p>";

  const html = `
    <div style="font-family: -apple-system, sans-serif; color: #16281d; max-width: 560px;">
      <h2 style="color: #2f6e2b;">⛳ ${safeName} is looking good</h2>
      <p>Conditions right now: <strong>${scoreStr}/10 (${label})</strong></p>
      <p>Weather: ${Math.round(current.tempF)}°F, ${Math.round(current.windMph)} mph wind, ${Math.round(current.precipProbability)}% rain chance</p>
      <h3>Best tee time windows</h3>
      ${windowsHtml}
      <p><a href="${safeCourseUrl}" style="color: #2f6e2b;">Open in Rain Check →</a></p>
      <hr style="border: none; border-top: 1px solid #dcedd9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #5da755;">
        You're getting this because you set an alert threshold for ${safeName}.
        <a href="${safeUnsubUrl}" style="color: #5da755;">Unsubscribe</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${courseName}: ${scoreStr}/10 conditions today`,
    html,
  });

  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

export async function sendConditionDropAlert(params: {
  to: string;
  courseName: string;
  teeTime: Date;
  score: number;
  threshold: number;
  tempF: number;
  windMph: number;
  precipProbability: number;
  unsubscribeUrl: string;
  courseUrl: string;
}): Promise<void> {
  const {
    to,
    courseName,
    teeTime,
    score,
    threshold,
    tempF,
    windMph,
    precipProbability,
    unsubscribeUrl,
    courseUrl,
  } = params;

  const safeName = escapeHtml(courseName);
  const safeCourseUrl = escapeHtml(courseUrl);
  const safeUnsubUrl = escapeHtml(unsubscribeUrl);
  const teeStr = teeTime.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const scoreStr = score.toFixed(1);

  const html = `
    <div style="font-family: -apple-system, sans-serif; color: #16281d; max-width: 560px;">
      <h2 style="color: #c26825;">⚠️ Heads up: conditions dropping for your ${safeName} round</h2>
      <p>Forecast for your <strong>${teeStr}</strong> tee time now shows <strong>${scoreStr}/10</strong> — below your ${threshold}/10 threshold.</p>
      <p>Weather at tee time: ${Math.round(tempF)}°F, ${Math.round(windMph)} mph wind, ${Math.round(precipProbability)}% rain chance</p>
      <p>Might be worth rescheduling.</p>
      <p><a href="${safeCourseUrl}" style="color: #2f6e2b;">Check the full forecast →</a></p>
      <hr style="border: none; border-top: 1px solid #dcedd9; margin: 24px 0;" />
      <p style="font-size: 12px; color: #5da755;">
        You're getting this because you planned a round at ${safeName}.
        <a href="${safeUnsubUrl}" style="color: #5da755;">Cancel this alert</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⚠️ ${courseName}: forecast dropped to ${scoreStr}/10 for your ${teeStr} tee time`,
    html,
  });

  if (error) throw new Error(`Resend send failed: ${error.message}`);
}
