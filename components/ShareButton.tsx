"use client";

import { useState } from "react";

type Props = {
  courseName: string;
  score: number;
  label: string;
};

export default function ShareButton({ courseName, score, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    const title = `${courseName}: ${score.toFixed(1)}/10 (${label})`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="whitespace-nowrap rounded-full bg-fairway-100 px-4 py-2 text-sm font-semibold text-fairway-700 transition-transform hover:scale-105 active:scale-95"
    >
      {copied ? "✓ Copied!" : "↗ Share"}
    </button>
  );
}
