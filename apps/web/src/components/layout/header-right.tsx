"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AuthStatus } from "@/components/auth/auth-status";
import { ProfileBadge } from "@/components/profile/profile-badge";
import type { SiteLink } from "@/types/page";

type Props = {
  navigation: SiteLink[];
  initialProfile: {
    full_name?: string | null;
    diet_values?: string[] | null;
    allergies?: string[] | null;
    kitchen_category_ids?: string[] | null;
  } | null;
};

export function HeaderRight({ navigation, initialProfile }: Props) {
  const [signedIn, setSignedIn] = useState(false);

  const onAuthStateChange = useCallback((state: { status: string }) => {
    setSignedIn(state.status === "signed_in");
  }, []);

  const filteredNavigation = signedIn
    ? navigation.filter((item) => item.href !== "/registrering" && item.href !== "/logg-inn")
    : navigation;

  return (
    <div className="flex items-center gap-3">
      {filteredNavigation.length > 0 ? (
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2" aria-label="Hovedmeny">
          {filteredNavigation.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="px-2 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground md:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
      {signedIn ? (
        <ProfileBadge initialProfile={initialProfile} />
      ) : (
        <AuthStatus onAuthStateChange={onAuthStateChange} />
      )}
    </div>
  );
}

