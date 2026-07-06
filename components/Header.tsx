import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-fairway-100/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold text-fairway-800 font-display"
        >
          <span className="animate-bob text-2xl" aria-hidden="true">⛳</span>
          <span>Rain Check</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-fairway-700 transition-colors hover:bg-fairway-100"
          >
            Search
          </Link>
          <Link
            href="/favorites"
            className="rounded-full px-3 py-1.5 text-fairway-700 transition-colors hover:bg-fairway-100"
          >
            ⭐ Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
}
