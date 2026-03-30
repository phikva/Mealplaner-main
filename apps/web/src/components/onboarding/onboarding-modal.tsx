"use client";

import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { urlFor } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ActiveOnboardingDocument, BrukerprofilSettings } from "@/types/page";

type OnboardingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ActiveOnboardingDocument;
  profileSettings: BrukerprofilSettings | null;
  initialProfile: {
    full_name?: string | null;
    diet_values?: string[] | null;
    allergies?: string[] | null;
    kitchen_category_ids?: string[] | null;
  } | null;
  onCompleted?: () => void;
};

const isExternal = (href: string) => href.startsWith("http://") || href.startsWith("https://");

export function OnboardingModal({
  open,
  onOpenChange,
  document: doc,
  profileSettings,
  initialProfile,
  onCompleted,
}: OnboardingModalProps) {
  const sections = doc.content ?? [];
  const dietOptions = profileSettings?.kostholdsbehov ?? [];
  const allergyOptions = profileSettings?.vanligeAllergier ?? [];
  const kitchenOptions = profileSettings?.kjokkenTyper ?? [];
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [dietValues, setDietValues] = useState<string[]>(initialProfile?.diet_values ?? []);
  const [allergies, setAllergies] = useState<string[]>(initialProfile?.allergies ?? []);
  const [kitchenIds, setKitchenIds] = useState<string[]>(initialProfile?.kitchen_category_ids ?? []);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const canShowProfileStep = useMemo(() => {
    return dietOptions.length > 0 || allergyOptions.length > 0 || kitchenOptions.length > 0;
  }, [allergyOptions.length, dietOptions.length, kitchenOptions.length]);

  const totalSteps = sections.length + (canShowProfileStep ? 1 : 0);
  const isLastStep = step >= totalSteps - 1;
  const isProfileStep = canShowProfileStep && step === totalSteps - 1;
  const currentSection = !isProfileStep ? sections[step] : null;

  useEffect(() => {
    if (open) {
      setStep(0);
      setSaveState("idle");
      setSaveMessage(null);
    }
  }, [open]);

  const toggle = (current: string[], value: string) =>
    current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  const onSaveProfile = async () => {
    setSaveState("saving");
    setSaveMessage(null);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
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
      onboarding_completed: true,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      setSaveState("error");
      setSaveMessage(error.message);
      return;
    }

    setSaveState("saved");
    setSaveMessage("Profil lagret.");
    onCompleted?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
          )}
        />
        <Dialog.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[min(92vh,900px)] w-[min(100vw-1.5rem,620px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-lg duration-200",
          )}
        >
          <div className="flex max-h-[min(90vh,840px)] flex-col">
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-semibold tracking-tight">{doc.title}</Dialog.Title>
                  <p className="mt-1 text-xs font-semibold tracking-[0.06em] text-muted-foreground">
                    Steg {Math.min(step + 1, totalSteps)} av {totalSteps}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Lukk
                </button>
              </div>
              <Dialog.Description className="sr-only">
                Velkommen. Les gjennom stegene og lukk når du er klar.
              </Dialog.Description>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!isProfileStep && currentSection ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {currentSection.title}
                  </h2>
                  {currentSection.body && currentSection.body.length > 0 ? (
                    <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
                      <PortableText value={currentSection.body} />
                    </div>
                  ) : null}
                  {currentSection.image ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={urlFor(currentSection.image).width(900).height(560).fit("crop").url()}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 600px"
                        unoptimized={(currentSection.image.asset?._ref ?? "").endsWith("-gif")}
                      />
                    </div>
                  ) : null}
                  {currentSection.useCta && currentSection.primaryCta?.label && currentSection.primaryCta?.href ? (
                    <Link
                      href={currentSection.primaryCta.href}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      target={isExternal(currentSection.primaryCta.href) ? "_blank" : undefined}
                      rel={isExternal(currentSection.primaryCta.href) ? "noreferrer noopener" : undefined}
                    >
                      {currentSection.primaryCta.label}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {isProfileStep ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Tilpass profilen din
                  </h2>

                        <label className="block space-y-1.5">
                          <span className="text-sm font-semibold">Navn</span>
                          <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            type="text"
                            autoComplete="name"
                            placeholder="F.eks. Philip"
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
                </div>
              ) : null}
            </div>

            <div className="border-t border-border/60 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Tilbake
                </button>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    Hopp over
                  </button>
                  {isProfileStep ? (
                    <button
                      type="button"
                      onClick={onSaveProfile}
                      disabled={saveState === "saving"}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {saveState === "saving" ? "Lagrer..." : "Fullfør"}
                    </button>
                  ) : isLastStep ? (
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Ferdig
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Neste
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
