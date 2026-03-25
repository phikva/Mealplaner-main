import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { RecipeGridBlock, SanityRecipe } from "@/types/page";

type Props = {
  block: RecipeGridBlock;
  recipes: SanityRecipe[];
};

export const RecipeGridBlockView = ({ block, recipes }: Props) => {
  const categoryId = block.kategori?._ref || block.kategori?._id;
  const maxItems = block.maxItems ?? 8;
  const showTitle = block.showTitle ?? true;
  const showDescription = block.showDescription ?? true;

  const filteredRecipes = categoryId
    ? recipes.filter((recipe) => recipe.categoryIds?.includes(categoryId))
    : recipes;

  const visibleRecipes = filteredRecipes.slice(0, maxItems);
  const isCarousel = block.layout === "carousel";

  return (
    <section className="space-y-5 rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm md:p-8">
      {showTitle || (showDescription && block.description) ? (
        <div className="space-y-2">
          {showTitle ? (
            <h2 className="text-3xl font-semibold tracking-tight">{block.title}</h2>
          ) : null}
          {showDescription && block.description ? (
            <p className="text-sm text-muted-foreground">{block.description}</p>
          ) : null}
        </div>
      ) : null}

      {visibleRecipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen oppskrifter funnet for valgt kategori.
        </p>
      ) : isCarousel ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {visibleRecipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} className="min-w-[280px] snap-start" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

  return (
    <article className={`overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${className || ""}`}>
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
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold leading-tight">{recipe.tittel}</h3>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {typeof recipe.totalKcal === "number" ? (
            <span>{Math.round(recipe.totalKcal)} kcal</span>
          ) : null}
          {typeof recipe.porsjoner === "number" ? <span>{recipe.porsjoner} porsjoner</span> : null}
        </div>
      </div>
    </article>
  );
};
