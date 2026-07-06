import type { CourseSearchResult } from "@/lib/types";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
};

type GooglePlacesSearchResponse = {
  places?: GooglePlace[];
};

// We want golf courses AND country clubs (many private clubs are typed
// as country_club in Google Maps even when they have a course). Rather
// than run two searches, we drop the strict includedType filter and
// nudge the text query toward golf-related places. Callers can inspect
// primaryType on the result to differentiate — e.g., only surface a
// GolfNow booking link for actual golf_course results.
function normalizeQuery(query: string): string {
  const lower = query.toLowerCase();
  if (
    lower.includes("golf") ||
    lower.includes("country club") ||
    lower.includes("country_club")
  ) {
    return query;
  }
  return `${query} golf`;
}

export async function searchGolfCourses(query: string): Promise<CourseSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set");
  }

  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types",
    },
    body: JSON.stringify({
      textQuery: normalizeQuery(query),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places search failed (${res.status}): ${body}`);
  }

  const data: GooglePlacesSearchResponse = await res.json();

  return (data.places ?? [])
    .filter((place) => place.location?.latitude != null && place.location?.longitude != null)
    .map((place) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "Unknown course",
      address: place.formattedAddress ?? "",
      lat: place.location!.latitude!,
      lng: place.location!.longitude!,
      primaryType: place.primaryType ?? place.types?.[0] ?? "",
    }));
}
