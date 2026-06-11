export function RouteLoading({ label = "Laster…" }: { label?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:gap-6 md:px-6 md:py-10">
      <p className="sr-only">{label}</p>
      <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/70" aria-hidden />
      <div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted/60" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-muted/50" aria-hidden />
        ))}
      </div>
    </main>
  );
}
