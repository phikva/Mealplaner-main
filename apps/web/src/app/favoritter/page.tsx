import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FavoritesClient } from "@/components/recipes/favorites-client";
import { getAuthUser } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Favoritter",
  description: "Dine favorittoppskrifter – samme visning som oppskriftsarkivet med søk, filter og liste eller rutenett.",
};

export default async function FavoritesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/logg-inn?next=/favoritter");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-4">
        <nav
          aria-label="Brødsmuler"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground md:text-sm"
        >
          <Link
            href="/oppskrifter"
            prefetch
            className="inline-flex items-center border border-border/70 px-2 py-1 transition-colors hover:text-foreground"
          >
            Alle oppskrifter
          </Link>
          <span aria-hidden className="text-muted-foreground/70">
            →
          </span>
          <span className="inline-flex items-center border border-border/70 px-2 py-1 text-foreground">
            Favoritter
          </span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Favoritter</h1>
      </header>

      <FavoritesClient />
    </main>
  );
}
