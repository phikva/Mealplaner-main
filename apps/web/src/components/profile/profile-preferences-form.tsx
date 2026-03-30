"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { BrukerprofilSettings } from "@/types/page";

type ProfileRow = {
  full_name?: string | null;
  diet_values?: string[] | null;
  allergies?: string[] | null;
  kitchen_category_ids?: string[] | null;
};

type Props = {
  settings: BrukerprofilSettings | null;
  initialProfile: ProfileRow | null;
};

export function ProfilePreferencesForm({ settings, initialProfile }: Props) {
  const dietOptions = settings?.kostholdsbehov ?? [];
  const allergyOptions = settings?.vanligeAllergier ?? [];
  const kitchenOptions = settings?.kjokkenTyper ?? [];

  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [dietValues, setDietValues] = useState<string[]>(initialProfile?.diet_values ?? []);
  const [allergies, setAllergies] = useState<string[]>(initialProfile?.allergies ?? []);
  const [kitchenIds, setKitchenIds] = useState<string[]>(initialProfile?.kitchen_category_ids ?? []);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(initialProfile?.full_name ?? "");
    setDietValues(initialProfile?.diet_values ?? []);
    setAllergies(initialProfile?.allergies ?? []);
    setKitchenIds(initialProfile?.kitchen_category_ids ?? []);
  }, [
    initialProfile?.allergies,
    initialProfile?.diet_values,
    initialProfile?.full_name,
    initialProfile?.kitchen_category_ids,
  ]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const syncLatest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name,diet_values,allergies,kitchen_category_ids,tier_sanity_id,tier_slug")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!data?.tier_sanity_id && !data?.tier_slug) {
        await fetch("/api/ensure-profile", { method: "POST" });
      }
      if (!data) return;
      setFullName(data.full_name ?? "");
      setDietValues(data.diet_values ?? []);
      setAllergies(data.allergies ?? []);
      setKitchenIds(data.kitchen_category_ids ?? []);
    };

    syncLatest();
    return () => {
      cancelled = true;
    };
  }, []);

  const canShow = useMemo(() => {
    return dietOptions.length > 0 || allergyOptions.length > 0 || kitchenOptions.length > 0;
  }, [allergyOptions.length, dietOptions.length, kitchenOptions.length]);

  const toggle = (current: string[], value: string) =>
    current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  const onSave = async () => {
    setSaveState("saving");
    setSaveMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveState("error");
      setSaveMessage("Du må være logget inn for å lagre profilen.");
      return;
    }

    const payload = {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName.trim() ? fullName.trim() : null,
      diet_values: dietValues,
      allergies,
      kitchen_category_ids: kitchenIds,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      setSaveState("error");
      setSaveMessage(error.message);
      return;
    }

    setSaveState("saved");
    setSaveMessage("Endringer lagret.");
  };

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">Se og oppdater preferansene dine.</p>
      </header>

      {!canShow ? (
        <p className="text-sm text-muted-foreground">
          Ingen profilinnstillinger funnet i Sanity ennå.
        </p>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border/60 bg-background/85 p-5 shadow-sm">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Navn</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {dietOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Kosthold</p>
              <div className="flex flex-wrap gap-2">
                {dietOptions.map((o) => {
                  const active = dietValues.includes(o.verdi);
                  return (
                    <button
                      key={o.verdi}
                      type="button"
                      onClick={() => setDietValues((cur) => toggle(cur, o.verdi))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/70 bg-background hover:bg-muted",
                      )}
                    >
                      {o.navn}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {allergyOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Allergier</p>
              <div className="flex flex-wrap gap-2">
                {allergyOptions.map((o) => {
                  const active = allergies.includes(o.navn);
                  return (
                    <button
                      key={o.navn}
                      type="button"
                      onClick={() => setAllergies((cur) => toggle(cur, o.navn))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/70 bg-background hover:bg-muted",
                      )}
                    >
                      {o.navn}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {kitchenOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Kjøkken og preferanser</p>
              <div className="flex flex-wrap gap-2">
                {kitchenOptions.map((o) => {
                  const label = o.name ?? o.slug?.current ?? o._id;
                  const active = kitchenIds.includes(o._id);
                  return (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => setKitchenIds((cur) => toggle(cur, o._id))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/70 bg-background hover:bg-muted",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {saveMessage ? (
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-semibold",
                saveState === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-emerald-600/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
              )}
            >
              {saveMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Logg ut
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saveState === "saving"}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saveState === "saving" ? "Lagrer..." : "Lagre endringer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

