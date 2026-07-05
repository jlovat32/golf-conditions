import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-fairway-700 bg-fairway-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-fairway-50">
          <span aria-hidden="true">⛳</span>
          <span>Rain Check</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-fairway-100">
          <Link href="/" className="transition-colors hover:text-white">
            Search
          </Link>
          <Link href="/favorites" className="transition-colors hover:text-white">
            Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
}
