"use client";

import { useState } from "react";
import { planRound } from "@/app/course/[placeId]/actions";

type Props = {
  placeId: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
};

function defaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PlanRoundForm({ placeId, name, address, lat, lng }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teeTimeLocal, setTeeTimeLocal] = useState(defaultDateTime());
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    setError(null);
    // Convert the datetime-local input (browser local time) to a proper ISO
    // UTC string before submitting so the server can store it unambiguously.
    const teeTimeIso = new Date(teeTimeLocal).toISOString();
    formData.set("teeTimeIso", teeTimeIso);

    try {
      await planRound(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan round");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="whitespace-nowrap rounded-full bg-sky-100 px-5 py-2.5 font-semibold text-sky-500 shadow-md shadow-sky-100/60 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {saved ? "✓ Round planned!" : expanded ? "Cancel" : "📅 Plan a round"}
      </button>

      {expanded && (
        <form
          action={action}
          className="flex w-full flex-col gap-3 rounded-3xl border border-fairway-100 bg-white p-5 shadow-xl shadow-fairway-100/60 sm:w-80"
        >
          <input type="hidden" name="placeId" value={placeId} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="address" value={address} />
          <input type="hidden" name="lat" value={lat} />
          <input type="hidden" name="lng" value={lng} />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fairway-500">
              🕑 Tee time
            </label>
            <input
              type="datetime-local"
              required
              value={teeTimeLocal}
              onChange={(e) => setTeeTimeLocal(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-fairway-200 px-4 py-2 text-sm focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fairway-500">
              📧 Warn me at
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-full border border-fairway-200 px-4 py-2 text-sm focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fairway-500">
              Warn if score drops below
            </label>
            <input
              type="number"
              name="alertThreshold"
              min="1"
              max="10"
              step="0.5"
              defaultValue="7"
              className="mt-1.5 w-full rounded-full border border-fairway-200 px-4 py-2 text-sm focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-200"
            />
          </div>

          <p className="text-xs text-fairway-400">
            We&apos;ll email you in the 24 hours before your tee time if the
            forecast for that hour dips below the threshold.
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <button
            type="submit"
            className="mt-1 rounded-full bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Plan round
          </button>
        </form>
      )}
    </div>
  );
}
