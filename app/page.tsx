import { Suspense } from "react";
import CourseSearch from "@/components/CourseSearch";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-fairway-700 shadow-sm ring-1 ring-fairway-100">
          <span>🌤️</span>
          <span>Powered by live weather</span>
        </div>

        <h1 className="font-display text-5xl font-semibold tracking-tight text-fairway-900 sm:text-6xl">
          Should you play <br className="hidden sm:block" />
          today?
        </h1>

        <p className="max-w-md text-lg text-fairway-700">
          Search any golf course. We'll tell you if the weather's worth teeing up —
          and pick your best window.
        </p>

        <Suspense fallback={<div className="h-16 w-full max-w-xl animate-pulse rounded-full bg-white/60" />}>
          <CourseSearch />
        </Suspense>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-fairway-500">
          <span>Try:</span>
          {["Pebble Beach", "Bethpage Black", "Torrey Pines"].map((q) => (
            <a
              key={q}
              href={`?q=${encodeURIComponent(q)}`}
              className="rounded-full bg-white/70 px-3 py-1 text-fairway-700 ring-1 ring-fairway-100 transition-colors hover:bg-fairway-100"
            >
              {q}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
