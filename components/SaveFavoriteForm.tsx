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
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="whitespace-nowrap rounded-full border border-fairway-200 bg-white px-4 py-2 text-sm font-medium text-fairway-700 transition-colors hover:bg-fairway-50"
      >
        {saved ? "Saved ✓" : expanded ? "Cancel" : "★ Save favorite"}
      </button>

      {expanded && (
        <form
          action={action}
          className="flex w-72 flex-col gap-2 rounded-2xl border border-fairway-100 bg-white p-4 shadow-sm"
        >
          <input type="hidden" name="placeId" value={placeId} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="address" value={address} />
          <input type="hidden" name="lat" value={lat} />
          <input type="hidden" name="lng" value={lng} />

          <label className="text-xs font-medium text-fairway-600">
            Email me when conditions are good (optional)
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className="rounded-lg border border-fairway-200 px-3 py-1.5 text-sm focus:border-fairway-500 focus:outline-none"
          />

          <label className="mt-1 text-xs font-medium text-fairway-600">
            Alert threshold (1-10)
          </label>
          <input
            type="number"
            name="alertThreshold"
            min="1"
            max="10"
            step="0.5"
            defaultValue="8"
            className="rounded-lg border border-fairway-200 px-3 py-1.5 text-sm focus:border-fairway-500 focus:outline-none"
          />

          <button
            type="submit"
            className="mt-2 rounded-full bg-fairway-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-fairway-700"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
