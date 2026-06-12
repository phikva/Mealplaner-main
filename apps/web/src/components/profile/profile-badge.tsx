"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";

export function ProfileBadge() {
  const { email, profile, status } = useSession();

  const initials = useMemo(() => {
    const base = (profile?.full_name ?? email ?? "").trim();
    if (!base) return "P";
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "P";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
    return (first + (second ?? "")).toUpperCase();
  }, [email, profile?.full_name]);

  if (status === "loading") {
    return <div className="h-8 w-20 rounded-full bg-muted/70" aria-hidden />;
  }

  return (
    <Link
      href="/profil"
      prefetch
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-2 py-1 text-xs font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted",
      )}
      aria-label="Gå til profil"
    >
      <span className="grid size-6 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
        {initials}
      </span>
      <span className="hidden md:inline">Profil</span>
    </Link>
  );
}
