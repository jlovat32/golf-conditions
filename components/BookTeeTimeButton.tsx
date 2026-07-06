"use client";

type Props = {
  courseName: string;
  placeId: string;
  score: number;
};

function buildBookingUrl(courseName: string): string | null {
  const template = process.env.NEXT_PUBLIC_GOLFNOW_AFFILIATE_URL;
  if (!template) return null;
  return template.replace("{query}", encodeURIComponent(courseName));
}

export default function BookTeeTimeButton({ courseName, placeId, score }: Props) {
  const url = buildBookingUrl(courseName);
  if (!url) return null;

  const recommended = score >= 7;

  async function handleClick() {
    try {
      await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner: "golfnow",
          placeId,
          courseName,
          score,
        }),
        keepalive: true,
      });
    } catch {
      // click tracking is best-effort; do not block the outbound link
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        className={
          recommended
            ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fairway-500 to-fairway-600 px-6 py-4 font-display text-lg font-semibold text-white shadow-xl shadow-fairway-300/40 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            : "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-fairway-200 bg-white px-6 py-3 font-medium text-fairway-700 transition-colors hover:bg-fairway-50"
        }
      >
        <span aria-hidden="true">🏌️</span>
        Book tee time
        <span aria-hidden="true">→</span>
      </a>
      <span className="text-xs text-fairway-400">
        Affiliate link — we may earn a commission on bookings.
      </span>
    </div>
  );
}
