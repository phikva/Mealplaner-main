import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import { urlFor } from "@/lib/sanity/image";
import { getRecipeByPath, getRecipePaths } from "@/lib/sanity/recipes";

type PageProps = {
  params: Promise<{ path: string }>;
};

const formatMeasurement = (item: {
  measurement?: { unit?: string; unitQuantity?: number };
  mengde?: string;
}) => {
  if (item.mengde) {
    return item.mengde;
  }
  const quantity = item.measurement?.unitQuantity;
  const unit = item.measurement?.unit;
  if (typeof quantity === "number" && unit) {
    return `${quantity} ${unit}`;
  }
  if (typeof quantity === "number") {
    return `${quantity}`;
  }
  if (unit) {
    return unit;
  }
  return "";
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

export default async function RecipePage({ params }: PageProps) {
  const { path } = await params;
  const recipe = await getRecipeByPath(path);

  if (!recipe) {
    notFound();
  }

  const imageUrl = recipe.image
    ? urlFor(recipe.image).width(1400).height(900).fit("crop").url()
    : null;
  const ingredients = recipe.ingrediens ?? [];
  const instructions = recipe.instruksjoner ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{recipe.tittel}</h1>
            {recipe.categories && recipe.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map((category) => (
                  <Link
                    key={`${recipe._id}-${category._id}`}
                    href={getCategoryHref(category)}
                    className={`px-3 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] hover:bg-muted/40 ${getCategoryTagClassName(category.name)}`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {typeof recipe.totalKcal === "number" ? (
                <span className="border border-border/70 bg-secondary px-3 py-1 font-sans text-[11px] font-semibold tracking-[0.02em]">
                  {Math.round(recipe.totalKcal)} kcal
                </span>
              ) : null}
              {typeof recipe.porsjoner === "number" ? (
                <span className="border border-border/70 bg-secondary px-3 py-1 font-sans text-[11px] font-semibold tracking-[0.02em]">
                  {recipe.porsjoner} porsjoner
                </span>
              ) : null}
            </div>
          </header>

          <section className="space-y-3 bg-card/45 p-5">
            <h2 className="text-2xl font-bold">Ingredienser</h2>
            {ingredients.length > 0 ? (
              <ul className="space-y-2">
                {ingredients.map((item) => (
                  <li
                    key={item._key || `${item.name}-${item.mengde}`}
                    className="flex items-start justify-between gap-4 border-b border-border/35 py-2 text-base last:border-b-0"
                  >
                    <span className="font-medium">{item.name || "Ukjent ingrediens"}</span>
                    <span className="text-muted-foreground">{formatMeasurement(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen ingredienser lagt til ennå.</p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MacroCard label="Protein" value={recipe.totalMakros?.protein} />
            <MacroCard label="Karbs" value={recipe.totalMakros?.karbs} />
            <MacroCard label="Fett" value={recipe.totalMakros?.fett} />
          </section>

          {recipe.notater ? (
            <section className="bg-card/45 p-5">
              <h2 className="mb-2 text-xl font-bold">Notater</h2>
              <p className="whitespace-pre-wrap text-base text-muted-foreground">{recipe.notater}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden bg-muted/35">
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
          </div>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Slik gjør du</h2>
            {instructions.length > 0 ? (
              <ol className="space-y-3">
                {instructions.map((step, index) => (
                  <li key={`${index + 1}-${step.slice(0, 24)}`} className="bg-card/45 p-4">
                    <p className="mb-1 text-base font-semibold">Steg {index + 1}</p>
                    <p className="whitespace-pre-wrap text-base text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-base text-muted-foreground">Ingen steg registrert ennå.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

const MacroCard = ({ label, value }: { label: string; value?: number }) => (
  <article className="bg-card/45 p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-semibold">{typeof value === "number" ? `${Math.round(value)} g` : "-"}</p>
  </article>
);
