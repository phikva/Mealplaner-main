"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActiveOnboardingDocument, BrukerprofilSettings } from "@/types/page";
import { OnboardingModal } from "./onboarding-modal";

const storageKey = (userId: string) => `mealplaner:onboarding:${userId}`;

type OnboardingGateProps = {
  onboarding: ActiveOnboardingDocument | null;
  initialUserId: string | null;
  profileSettings: BrukerprofilSettings | null;
  initialProfile: {
    full_name?: string | null;
    diet_values?: string[] | null;
    allergies?: string[] | null;
    kitchen_category_ids?: string[] | null;
    onboarding_completed?: boolean | null;
  } | null;
};

export function OnboardingGate({
  onboarding,
  initialUserId,
  profileSettings,
  initialProfile,
}: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState(Boolean(initialProfile?.onboarding_completed));

  useEffect(() => {
    setHydrated(true);
    if (initialUserId) {
      setDismissed(!!localStorage.getItem(storageKey(initialUserId)));
    }
  }, [initialUserId]);

  useEffect(() => {
    setCompleted(Boolean(initialProfile?.onboarding_completed));
  }, [initialProfile?.onboarding_completed]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        setDismissed(!!localStorage.getItem(storageKey(uid)));
      } else {
        setDismissed(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const welcome = searchParams.get("onboarding") === "1";
  const preview = searchParams.get("previewOnboarding") === "1";
  const open = Boolean(
    hydrated && onboarding && userId && welcome && (preview || (!dismissed && !completed)),
  );

  const handleOpenChange = useCallback(
    async (next: boolean) => {
      if (!next && userId) {
        if (!preview) {
          const supabase = createClient();
          await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", userId);

          setCompleted(true);
          localStorage.setItem(storageKey(userId), "1");
          setDismissed(true);
        }
        const params = new URLSearchParams(searchParams.toString());
        params.delete("onboarding");
        params.delete("previewOnboarding");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
    },
    [pathname, preview, router, searchParams, userId],
  );

  if (!onboarding) {
    return null;
  }

  return (
    <OnboardingModal
      open={open}
      onOpenChange={handleOpenChange}
      document={onboarding}
      profileSettings={profileSettings}
      initialProfile={initialProfile}
      onCompleted={() => setCompleted(true)}
    />
  );
}
