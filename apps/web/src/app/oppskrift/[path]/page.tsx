import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import { IngredientChecklist } from "@/components/recipe/ingredient-checklist";
import { urlFor } from "@/lib/sanity/image";
import { getRecipeByPath, getRecipePaths } from "@/lib/sanity/recipes";
import { RecipeFavoriteButton } from "@/components/recipes/recipe-favorite-button";
import { getTiers } from "@/lib/sanity/tiers";
import { getFavoriteRules, resolveTierForProfile } from "@/lib/tier-access";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ from?: string; fromCategory?: string }>;
};

export async function generateStaticParams() {
  const paths = await getRecipePaths();
  return paths.filter((item) => item.path);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  const recipe = await getRecipeByPath(path);

  if (!recipe) {
    return {
      title: "Oppskrift finnes ikke",
      description: "Denne oppskriften er ikke tilgjengelig.",
    };
  }

  return {
    title: recipe.tittel,
    description: `Oppskrift på ${recipe.tittel}.`,
  };
}

export default async function RecipePage({ params, searchParams }: PageProps) {
  const { path } = await params;
  const { from, fromCategory } = await searchParams;
  const recipe = await getRecipeByPath(path);

  if (!recipe) {
    notFound();
  }

  if (recipe.path && recipe.path !== path) {
    const qs = from ? `?from=${encodeURIComponent(from)}` : "";
    redirect(`/oppskrift/${recipe.path}${qs}`);
  }

  const imageUrl = recipe.image
    ? urlFor(recipe.image).width(1400).height(900).fit("crop").url()
    : null;
  const ingredients = recipe.ingrediens ?? [];
  const instructions = recipe.instruksjoner ?? [];
  const fromPathCategory = from?.startsWith("/kategori/") ? from.split("/")[2] : undefined;
  const breadcrumbCategoryPath = fromCategory || fromPathCategory;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let favState = {
    authenticated: false,
    favorited: false,
    canFavorite: true,
    blockAdd: false,
  };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier_sanity_id,tier_slug")
      .eq("id", user.id)
      .maybeSingle();
    const tiers = await getTiers();
    const tier = resolveTierForProfile(tiers, profile?.tier_sanity_id, profile?.tier_slug);
    const rules = getFavoriteRules(tier);
    const { data: favRow } = await supabase
      .from("recipe_favorites")
      .select("recipe_sanity_id")
      .eq("user_id", user.id)
      .eq("recipe_sanity_id", recipe._id)
      .maybeSingle();
    const { count } = await supabase
      .from("recipe_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    const favorited = Boolean(favRow);
    const max = rules.maxFavorites;
    const blockAdd = max != null && (count ?? 0) >= max && !favorited;
    favState = {
      authenticated: true,
      favorited,
      canFavorite: rules.canFavorite,
      blockAdd,
    };
  }

  const breadcrumbCategory = breadcrumbCategoryPath
    ? recipe.categories?.find((category) => {
        const categoryPath = category.path || category.slug?.current || "";
        return categoryPath === breadcrumbCategoryPath;
      })
    : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-10">
      <nav aria-label="Brødsmuler" className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground md:mb-5 md:text-sm">
        <Link href="/kategori" className="inline-flex items-center border border-border/70 px-2 py-1 transition-colors hover:text-foreground">
          Kategorier
        </Link>
        {breadcrumbCategory ? (
          <>
            <span aria-hidden>→</span>
            <Link
              href={getCategoryHref(breadcrumbCategory)}
              className="inline-flex items-center border border-border/70 px-2 py-1 transition-colors hover:text-foreground"
            >
              {breadcrumbCategory.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>→</span>
        <span className="inline-flex items-center border border-border/70 px-2 py-1 text-foreground">
          {recipe.tittel}
        </span>
      </nav>
      <section className="grid gap-6 md:gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="order-1 space-y-4 lg:order-2 lg:space-y-5">
          <div className="overflow-hidden bg-muted/35">
            <div className="relative">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={recipe.tittel}
                  width={1400}
                  height={900}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center text-base text-muted-foreground">
                  Ingen bilde
                </div>
              )}
              {(typeof recipe.totalKcal === "number" || typeof recipe.porsjoner === "number") ? (
                <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-2">
                  {typeof recipe.totalKcal === "number" ? (
                    <span className="border border-border/70 bg-secondary px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] md:text-xs">
                      {Math.round(recipe.totalKcal)} kcal
                    </span>
                  ) : null}
                  {typeof recipe.porsjoner === "number" ? (
                    <span className="border border-border/70 bg-secondary px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] md:text-xs">
                      {recipe.porsjoner} porsjoner
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="absolute right-2 top-2 z-20 md:right-3 md:top-3">
                <RecipeFavoriteButton
                  recipeSanityId={recipe._id}
                  initialFavorited={favState.favorited}
                  canFavorite={favState.canFavorite}
                  blockAdd={favState.blockAdd}
                  isAuthenticated={favState.authenticated}
                  variant="icon"
                />
              </div>
            </div>
            {(typeof recipe.totalMakros?.protein === "number" ||
              typeof recipe.totalMakros?.karbs === "number" ||
              typeof recipe.totalMakros?.fett === "number") ? (
              <div className="flex flex-wrap gap-2 border-t border-border/50 bg-background/90 px-3 py-2.5 backdrop-blur-sm md:px-4 md:py-3">
                <MacroPill label="P" value={recipe.totalMakros?.protein} />
                <MacroPill label="K" value={recipe.totalMakros?.karbs} />
                <MacroPill label="F" value={recipe.totalMakros?.fett} />
              </div>
            ) : null}
          </div>

          <section id="fremgangsmate" className="hidden space-y-3 md:block">
            <h2 className="text-xl font-bold md:text-2xl">Slik gjør du</h2>
            {instructions.length > 0 ? (
              <ol className="space-y-2.5 md:space-y-3">
                {instructions.map((step, index) => (
                  <li
                    key={`${index + 1}-${step.slice(0, 24)}`}
                    className="grid grid-cols-[auto_1fr] gap-3 bg-card/55 p-3.5 md:p-5"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary md:h-8 md:w-8">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold md:text-base">Steg {index + 1}</p>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground md:text-base">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-base text-muted-foreground">Ingen steg registrert ennå.</p>
            )}
          </section>
        </div>

        <div className="order-2 space-y-5 md:space-y-6 lg:order-1">
          <header className="space-y-3 md:space-y-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{recipe.tittel}</h1>
            {recipe.categories && recipe.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map((category) => (
                  <Link
                    key={`${recipe._id}-${category._id}`}
                    href={getCategoryHref(category)}
                    className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] hover:bg-muted/40 ${getCategoryTagClassName(category.name)}`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <section className="space-y-2 md:hidden">
            <details open className="group rounded-2xl bg-secondary/30 p-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-border/70 bg-background/85 px-3 py-2 text-base font-bold">
                <span>Ingredienser</span>
                <span aria-hidden className="text-sm text-muted-foreground">
                  <span className="group-open:hidden">Åpne</span>
                  <span className="hidden group-open:inline">Lukk</span>
                </span>
              </summary>
              <div className="mt-3">
                <IngredientChecklist recipeId={recipe._id} ingredients={ingredients} compact />
              </div>
            </details>

            <details className="group rounded-2xl bg-muted/40 p-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-border/70 bg-background/85 px-3 py-2 text-base font-bold">
                <span>Fremgangsmåte</span>
                <span aria-hidden className="text-sm text-muted-foreground">
                  <span className="group-open:hidden">Åpne</span>
                  <span className="hidden group-open:inline">Lukk</span>
                </span>
              </summary>
              {instructions.length > 0 ? (
                <ol className="mt-3 space-y-2.5">
                  {instructions.map((step, index) => (
                    <li
                      key={`${index + 1}-${step.slice(0, 24)}`}
                      className="grid grid-cols-[auto_1fr] gap-3 rounded-xl bg-card/35 p-3.5"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Steg {index + 1}</p>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-base text-muted-foreground">Ingen steg registrert ennå.</p>
              )}
            </details>
          </section>

          <section
            id="ingredienser"
            className="hidden space-y-3 rounded-2xl bg-secondary/30 p-4 md:block md:p-5"
          >
            <h2 className="text-xl font-bold md:text-2xl">Ingredienser</h2>
            <IngredientChecklist recipeId={recipe._id} ingredients={ingredients} />
          </section>

          {recipe.notater ? (
            <section className="bg-muted/35 p-4 md:p-5">
              <h2 className="mb-2 text-lg font-bold md:text-xl">Notater</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground md:text-base">{recipe.notater}</p>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const MacroPill = ({ label, value }: { label: string; value?: number }) => (
  <span className="border border-border/70 bg-secondary/50 px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-foreground md:text-xs">
    {label}: {typeof value === "number" ? `${Math.round(value)} g` : "-"}
  </span>
);
