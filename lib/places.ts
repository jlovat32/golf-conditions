import type { CourseSearchResult } from "@/lib/types";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

type GooglePlacesSearchResponse = {
  places?: GooglePlace[];
};

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
        "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: "golf_course",
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
    }));
}
