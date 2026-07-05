import CourseSearch from "@/components/CourseSearch";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-background px-4 py-20 sm:px-6">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-fairway-900 sm:text-4xl">
          Find today&apos;s best tee times
        </h1>
        <p className="max-w-md text-base text-fairway-700">
          Search any golf course and see live weather-based playability conditions.
        </p>
        <CourseSearch />
      </div>
    </main>
  );
}
