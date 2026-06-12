"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { createClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const { status } = useSession();

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  if (status === "loading") {
    return (
      <div className="h-10 w-[5.5rem] rounded-full bg-muted" aria-hidden />
    );
  }

  if (status === "signed_out") {
    return (
      <Link
        href="/logg-inn"
        prefetch
        className="inline-flex min-h-10 items-center rounded-full border border-border/70 px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted"
      >
        Logg inn
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSignOut}
        className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted"
      >
        Logg ut
      </button>
    </div>
  );
}
