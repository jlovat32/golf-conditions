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
    <div className="flex flex-col items-start gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        className={
          recommended
            ? "inline-flex items-center justify-center rounded-full bg-fairway-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-fairway-700"
            : "inline-flex items-center justify-center rounded-full border border-fairway-200 bg-white px-4 py-2 text-sm font-medium text-fairway-700 transition-colors hover:bg-fairway-50"
        }
      >
        Book tee time →
      </a>
      <span className="text-xs text-fairway-400">
        Affiliate link — we earn a commission on bookings.
      </span>
    </div>
  );
}
