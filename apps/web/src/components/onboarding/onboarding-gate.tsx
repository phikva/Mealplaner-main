"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { createClient } from "@/lib/supabase/client";
import type { ActiveOnboardingDocument, BrukerprofilSettings } from "@/types/page";
import { OnboardingModal } from "./onboarding-modal";

const storageKey = (userId: string) => `mealplaner:onboarding:${userId}`;

type OnboardingGateProps = {
  onboarding: ActiveOnboardingDocument | null;
  profileSettings: BrukerprofilSettings | null;
};

export function OnboardingGate({ onboarding, profileSettings }: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId, profile } = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState(Boolean(profile?.onboarding_completed));

  useEffect(() => {
    setHydrated(true);
    if (userId) {
      setDismissed(!!localStorage.getItem(storageKey(userId)));
    }
  }, [userId]);

  useEffect(() => {
    setCompleted(Boolean(profile?.onboarding_completed));
  }, [profile?.onboarding_completed]);

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
      initialProfile={profile}
      onCompleted={() => setCompleted(true)}
    />
  );
}
