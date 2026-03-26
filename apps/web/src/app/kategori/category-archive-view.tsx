"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type CategoryArchiveItem = {
  _id: string;
  name: string;
  path: string;
  count: number;
  imageUrl: string | null;
};

type Props = {
  categories: CategoryArchiveItem[];
};

export const CategoryArchiveView = ({ categories }: Props) => {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <section className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-end">
        <div className="inline-flex border border-border/70 bg-background/85 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 text-xs font-semibold tracking-[0.02em] md:text-sm ${
              view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-xs font-semibold tracking-[0.02em] md:text-sm ${
              view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      <div className={view === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/kategori/${category.path}`}
            className={`group overflow-hidden bg-background/85 transition hover:-translate-y-0.5 ${
              view === "list"
                ? "grid grid-cols-[112px_1fr] gap-0 border-b border-border/60 pb-2 last:border-b-0 md:grid-cols-[180px_1fr]"
                : ""
            }`}
          >
            <div
              className={
                view === "grid"
                  ? "aspect-[16/10] bg-muted/30"
                  : "h-full min-h-[100px] bg-muted/30 md:min-h-[120px]"
              }
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={1000}
                  height={650}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Ingen bilde
                </div>
              )}
            </div>
            <div className={view === "grid" ? "p-4 md:p-5" : "p-3 md:p-4"}>
              <p className={view === "grid" ? "text-lg font-bold leading-tight md:text-xl" : "text-base font-bold leading-tight md:text-lg"}>
                {category.name}
              </p>
              <p className="mt-1">
                <span className="inline-flex items-center rounded-full border border-border/70 bg-secondary px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] text-foreground md:text-xs">
                {category.count} {category.count === 1 ? "oppskrift" : "oppskrifter"}
                </span>
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.02em] md:mt-3 md:text-sm">
                Se kategori
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
