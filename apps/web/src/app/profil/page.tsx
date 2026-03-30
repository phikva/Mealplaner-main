import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfilePreferencesForm } from "@/components/profile/profile-preferences-form";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import { getTiers } from "@/lib/sanity/tiers";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilPage() {
  const [settings, tiers, supabase] = await Promise.all([
    getBrukerprofilSettings(),
    getTiers(),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logg-inn");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,diet_values,allergies,kitchen_category_ids,tier_sanity_id,tier_slug")
    .eq("id", user.id)
    .maybeSingle();

  const defaultTier = tiers.find((t) => t.isDefault) ?? tiers[0] ?? null;
  const tier =
    (profile?.tier_sanity_id
      ? tiers.find((t) => t._id === profile.tier_sanity_id)
      : null) ??
    (profile?.tier_slug
      ? tiers.find((t) => t.slug?.current === profile.tier_slug)
      : null) ??
    defaultTier;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <section className="mb-8 rounded-2xl border border-border/60 bg-background/85 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground">
              Abonnement
            </p>
            <p className="text-lg font-semibold tracking-tight">
              {tier?.name ?? "Ukjent plan"}
            </p>
            {tier?.description ? (
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            ) : null}
            {tier?.features && tier.features.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:min-w-[220px]">
            <Link
              href="/abonnement"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Oppgrader medlemskap
            </Link>
            <Link
              href="/?onboarding=1&previewOnboarding=1"
              className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Se onboarding
            </Link>
          </div>
        </div>
      </section>
      <ProfilePreferencesForm settings={settings} initialProfile={profile} />
    </main>
  );
}

