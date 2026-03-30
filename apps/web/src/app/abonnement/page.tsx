import Link from "next/link";
import { redirect } from "next/navigation";
import { getTiers } from "@/lib/sanity/tiers";
import { createClient } from "@/lib/supabase/server";

export default async function AbonnementPage() {
  const [tiers, supabase] = await Promise.all([getTiers(), createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logg-inn");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier_sanity_id,tier_slug")
    .eq("id", user.id)
    .maybeSingle();

  const currentTierId = profile?.tier_sanity_id ?? null;
  const defaultTier = tiers.find((t) => t.isDefault) ?? tiers[0] ?? null;
  const effectiveCurrentTierId =
    currentTierId ??
    (profile?.tier_slug
      ? tiers.find((t) => t.slug?.current === profile.tier_slug)?._id ?? null
      : null) ??
    defaultTier?._id ??
    null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">
          Se planene og oppgrader når du er klar.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = effectiveCurrentTierId ? tier._id === effectiveCurrentTierId : false;
          return (
            <section
              key={tier._id}
              className="rounded-2xl border border-border/60 bg-background/85 p-5 shadow-sm"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">{tier.name}</h2>
                {tier.description ? (
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                ) : null}
              </div>

              {tier.features && tier.features.length > 0 ? (
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span aria-hidden>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4">
                {isCurrent ? (
                  <div className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Din nåværende plan
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    disabled
                    title="Betaling/oppgradering er ikke koblet til ennå."
                  >
                    Oppgrader
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Tilbake til{" "}
        <Link href="/profil" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Profil
        </Link>
        .
      </p>
    </main>
  );
}

