"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

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
      className="rounded-full border border-fairway-200 bg-white px-3 py-1.5 text-sm font-medium text-fairway-700 transition-colors hover:bg-fairway-50"
    >
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
