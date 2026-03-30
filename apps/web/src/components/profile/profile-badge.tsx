"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProfileRow = {
  full_name?: string | null;
  diet_values?: string[] | null;
  allergies?: string[] | null;
  kitchen_category_ids?: string[] | null;
};

type Props = {
  initialProfile: ProfileRow | null;
};

export function ProfileBadge({ initialProfile }: Props) {
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile);
  const [email, setEmail] = useState<string | null>(null);
  const initials = useMemo(() => {
    const base = (profile?.full_name ?? email ?? "").trim();
    if (!base) return "P";
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "P";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
    return (first + (second ?? "")).toUpperCase();
  }, [email, profile?.full_name]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setEmail(user?.email ?? null);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name,diet_values,allergies,kitchen_category_ids")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setProfile(data ?? null);
      }
    };

    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Link
      href="/profil"
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

