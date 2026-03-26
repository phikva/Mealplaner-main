"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import { urlFor } from "@/lib/sanity/image";
import type { RecipeGridBlock, SanityRecipe } from "@/types/page";

type Props = {
  block: RecipeGridBlock;
  recipes: SanityRecipe[];
};

export const RecipeGridBlockView = ({ block, recipes }: Props) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const categoryId = block.kategori?._ref || block.kategori?._id;
  const maxItems = block.maxItems ?? 8;
  const showTitle = block.showTitle ?? true;
  const showDescription = block.showDescription ?? true;

  const filteredRecipes = categoryId
    ? recipes.filter((recipe) => recipe.categoryIds?.includes(categoryId))
    : recipes;

  const visibleRecipes = filteredRecipes.slice(0, maxItems);
  const isCarousel = block.layout === "carousel";
  const showPrimaryCta = Boolean(block.useCta && block.primaryCta?.label && block.primaryCta?.href);
  const showSecondaryCta = Boolean(
    block.useCta &&
      block.ctaCount === "two" &&
      block.secondaryCta?.label &&
      block.secondaryCta?.href,
  );
  const isExternalLink = (href: string) => href.startsWith("http://") || href.startsWith("https://");
  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) {
      return;
    }
    const amount = Math.round(carouselRef.current.clientWidth * 0.8);
    carouselRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-6 py-4 md:py-6">
      {showTitle || (showDescription && block.description) ? (
        <div className="space-y-2">
          {showTitle ? (
            <h2 className="text-3xl font-bold tracking-tight">{block.title}</h2>
          ) : null}
          {showDescription && block.description ? (
            <p className="text-base text-muted-foreground">{block.description}</p>
          ) : null}
        </div>
      ) : null}
      {showPrimaryCta || showSecondaryCta ? (
        <div className="flex flex-wrap items-center gap-3">
          {showPrimaryCta ? (
            <Link
              href={block.primaryCta?.href || "/"}
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-semibold tracking-[0.02em] text-primary-foreground transition-all hover:bg-primary/90"
              target={block.primaryCta?.href && isExternalLink(block.primaryCta.href) ? "_blank" : undefined}
              rel={block.primaryCta?.href && isExternalLink(block.primaryCta.href) ? "noreferrer noopener" : undefined}
            >
              {block.primaryCta?.label}
            </Link>
          ) : null}
          {showSecondaryCta ? (
            <Link
              href={block.secondaryCta?.href || "/"}
              className="group inline-flex items-center gap-2 rounded-full border border-foreground/35 px-7 py-3 text-base font-semibold tracking-[0.02em] text-foreground transition-all hover:border-foreground hover:gap-3"
              target={block.secondaryCta?.href && isExternalLink(block.secondaryCta.href) ? "_blank" : undefined}
              rel={block.secondaryCta?.href && isExternalLink(block.secondaryCta.href) ? "noreferrer noopener" : undefined}
            >
              {block.secondaryCta?.label}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      ) : null}

      {visibleRecipes.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Ingen oppskrifter funnet for valgt kategori.
        </p>
      ) : isCarousel ? (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-lg text-foreground transition-colors hover:bg-muted/50"
              aria-label="Scroll karusell til venstre"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-lg text-foreground transition-colors hover:bg-muted/50"
              aria-label="Scroll karusell til høyre"
            >
              →
            </button>
          </div>
          <div ref={carouselRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {visibleRecipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} className="min-w-[280px] snap-start md:min-w-[340px]" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visibleRecipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
};

type RecipeCardProps = {
  recipe: SanityRecipe;
  className?: string;
};

const RecipeCard = ({ recipe, className }: RecipeCardProps) => {
  const imageUrl = recipe.image
    ? urlFor(recipe.image).width(800).height(500).fit("crop").url()
    : null;
  const recipePath = recipe.path || recipe.slug?.current || recipe._id;

  return (
    <article className={`overflow-hidden bg-background/85 transition duration-300 hover:-translate-y-0.5 ${className || ""}`}>
      <Link href={`/oppskrift/${recipePath}`} className="block">
        <div className="aspect-video bg-muted/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={recipe.tittel}
              width={800}
              height={500}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Ingen bilde
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={`/oppskrift/${recipePath}`} className="block">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight">{recipe.tittel}</h3>
        </Link>
        {recipe.categories && recipe.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {recipe.categories.map((category) => (
              <Link
                key={`${recipe._id}-${category._id}`}
                href={getCategoryHref(category)}
                className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] hover:bg-muted/40 ${getCategoryTagClassName(category.name)}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {typeof recipe.totalKcal === "number" ? (
            <span className="border border-border/70 bg-secondary px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em]">
              {Math.round(recipe.totalKcal)} kcal
            </span>
          ) : null}
          {typeof recipe.porsjoner === "number" ? (
            <span className="border border-border/70 bg-secondary px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em]">
              {recipe.porsjoner} porsjoner
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
};
