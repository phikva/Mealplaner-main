"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthStatus } from "@/components/auth/auth-status";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
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
  initialSignedIn: boolean;
  initialEmail: string | null;
};

export function HeaderRight({
  navigation,
  initialProfile,
  initialSignedIn,
  initialEmail,
}: Props) {
  const [signedIn, setSignedIn] = useState(initialSignedIn);

  const onAuthStateChange = useCallback((state: { status: string }) => {
    setSignedIn(state.status === "signed_in");
  }, []);

  // Keep header in sync after client-side login/logout without waiting on AuthStatus mount.
  useEffect(() => {
    setSignedIn(initialSignedIn);
  }, [initialSignedIn]);

  const filteredNavigation = signedIn
    ? navigation.filter((item) => item.href !== "/registrering" && item.href !== "/logg-inn")
    : navigation.filter(
        (item) =>
          !(
            item.href === "/registrering" &&
            item.label.trim().toLowerCase() === "registrer deg"
          ),
      );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
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
        <ProfileBadge initialProfile={initialProfile} initialEmail={initialEmail} />
      ) : (
        <AuthStatus onAuthStateChange={onAuthStateChange} />
      )}
      {filteredNavigation.length > 0 ? (
        <MobileNavDrawer items={filteredNavigation} signedIn={signedIn} />
      ) : null}
    </div>
  );
}

