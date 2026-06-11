import { redirect } from "next/navigation";
import { getMealPlanWithRecipesAction } from "@/app/actions/meal-plan";
import { addDays, localYmd, mondayOfWeek } from "@/components/plan/meal-plan-dates";
import { MealPlanView } from "@/components/plan/meal-plan-view";
import { MEAL_PLANNER_ROUTE } from "@/lib/app-routes";
import { getCategories } from "@/lib/sanity/categories";
import { getTiers } from "@/lib/sanity/tiers";
import { createClient } from "@/lib/supabase/server";
import { getMealStorageRules, resolveTierForProfile } from "@/lib/tier-access";

export const metadata = {
  title: MEAL_PLANNER_ROUTE.label,
  description: "Planlegg måltider og se makroer for uke og måned.",
};

const loginNext = `/logg-inn?next=${encodeURIComponent(MEAL_PLANNER_ROUTE.path)}`;

export default async function MaltidsplanleggerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginNext);

  const today = new Date();
  const mon = mondayOfWeek(today);
  const sun = addDays(mon, 6);
  const from = localYmd(mon);
  const to = localYmd(sun);

  const [bundle, categories, tiers, profileRes] = await Promise.all([
    getMealPlanWithRecipesAction(from, to),
    getCategories(),
    getTiers(),
    supabase.from("profiles").select("tier_sanity_id,tier_slug").eq("id", user.id).maybeSingle(),
  ]);
  if (!bundle.ok) {
    if (bundle.error === "not_authenticated") redirect(loginNext);
    throw new Error("Kunne ikke laste måltidsplan fra databasen.");
  }

  const categoryOptions = categories.map((c) => ({ _id: c._id, name: c.name }));
  const tier = resolveTierForProfile(tiers, profileRes.data?.tier_sanity_id, profileRes.data?.tier_slug);
  const mealStorageMaxDays = getMealStorageRules(tier).maxDays;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 md:gap-6 md:px-6 md:py-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{MEAL_PLANNER_ROUTE.label}</h1>
        <div className="max-w-2xl space-y-2 text-sm text-muted-foreground md:text-base">
          <p className="font-medium text-foreground/90">Slik bruker du planleggeren</p>
          <ul className="list-inside list-disc space-y-1 leading-relaxed marker:text-muted-foreground">
            <li>Legg til måltider med knappen under hver dag.</li>
            <li>Bytt visning med Uke, Måned eller Dag øverst og bla i perioden med pilene.</li>
            <li>Trykk på et måltid eller bruk «Kopier dag» for å kopiere til andre dager.</li>
            <li>Se samlet energi og makroer i boksen rett under.</li>
          </ul>
        </div>
      </header>
      <MealPlanView
        initialFrom={from}
        initialEntries={bundle.entries}
        initialRecipes={bundle.recipes}
        categoryOptions={categoryOptions}
        mealStorageMaxDays={mealStorageMaxDays}
      />
    </main>
  );
}
