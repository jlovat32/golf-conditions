"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseSearchResult } from "@/lib/types";

export default function CourseSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Search failed");
          setResults([]);
        } else {
          setError(null);
          setResults(data.results ?? []);
        }
      } catch {
        setError("Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectCourse(course: CourseSearchResult) {
    const params = new URLSearchParams({
      name: course.name,
      address: course.address,
      lat: String(course.lat),
      lng: String(course.lng),
    });
    router.push(`/course/${encodeURIComponent(course.placeId)}?${params.toString()}`);
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a golf course by name or city..."
        className="w-full rounded-full border border-fairway-200 bg-white px-5 py-3 text-base text-fairway-900 shadow-sm placeholder:text-fairway-400 focus:border-fairway-500 focus:outline-none focus:ring-2 focus:ring-fairway-300"
      />

      {loading && (
        <p className="mt-2 text-sm text-fairway-500">Searching...</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-fairway-100 bg-white shadow-lg">
          {results.map((course) => (
            <li key={course.placeId}>
              <button
                type="button"
                onClick={() => selectCourse(course)}
                className="block w-full px-5 py-3 text-left transition-colors hover:bg-fairway-50"
              >
                <span className="block font-medium text-fairway-900">{course.name}</span>
                <span className="block text-sm text-fairway-500">{course.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
