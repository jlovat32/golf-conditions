"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CourseSearchResult } from "@/lib/types";

export default function CourseSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
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
      <div className="relative">
        <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-xl">
          🔎
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Course name or city..."
          className="w-full rounded-full border-2 border-white/70 bg-white/90 py-5 pl-16 pr-6 text-lg text-fairway-900 shadow-lg shadow-fairway-100/60 placeholder:text-fairway-400 focus:border-fairway-400 focus:outline-none focus:ring-4 focus:ring-fairway-200/60"
        />
      </div>

      {loading && (
        <p className="mt-2 text-sm text-fairway-500">Looking up courses...</p>
      )}

      {error && (
        <p className="mt-2 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="absolute z-20 mt-3 w-full overflow-hidden rounded-3xl border border-fairway-100 bg-white/95 shadow-2xl shadow-fairway-200/40 backdrop-blur">
          {results.map((course) => (
            <li key={course.placeId}>
              <button
                type="button"
                onClick={() => selectCourse(course)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-fairway-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fairway-100 text-lg">
                  ⛳
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fairway-900">
                    {course.name}
                  </span>
                  <span className="block truncate text-sm text-fairway-500">
                    {course.address}
                  </span>
                </span>
                <span className="text-fairway-400">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
