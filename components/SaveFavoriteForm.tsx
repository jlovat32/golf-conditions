"use client";

import { useState } from "react";
import { saveFavorite } from "@/app/course/[placeId]/actions";

type Props = {
  placeId: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
};

export default function SaveFavoriteForm({ placeId, name, address, lat, lng }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  async function action(formData: FormData) {
    await saveFavorite(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setExpanded(false);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="whitespace-nowrap rounded-full bg-sun-200 px-5 py-2.5 font-semibold text-fairway-800 shadow-md shadow-sun-200/60 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {saved ? "✓ Saved!" : expanded ? "Cancel" : "⭐ Save & get alerts"}
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
              📧 Email me when it's great
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-full border border-fairway-200 px-4 py-2 text-sm focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fairway-500">
              Alert threshold (1-10)
            </label>
            <input
              type="number"
              name="alertThreshold"
              min="1"
              max="10"
              step="0.5"
              defaultValue="8"
              className="mt-1.5 w-full rounded-full border border-fairway-200 px-4 py-2 text-sm focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-200"
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-full bg-fairway-600 px-4 py-2.5 font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Save favorite
          </button>
        </form>
      )}
    </div>
  );
}
