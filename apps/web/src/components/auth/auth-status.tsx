"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type State =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; email: string | null };

export type AuthStatusProps = {
  onAuthStateChange?: (state: State) => void;
};

export function AuthStatus({ onAuthStateChange }: AuthStatusProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const supabase = createClient();

    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const nextState: State = { status: "signed_out" };
        setState(nextState);
        onAuthStateChange?.(nextState);
        return;
      }
      const nextState: State = { status: "signed_in", email: user.email ?? null };
      setState(nextState);
      onAuthStateChange?.(nextState);
    };

    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) {
        const nextState: State = { status: "signed_out" };
        setState(nextState);
        onAuthStateChange?.(nextState);
        return;
      }
      const nextState: State = { status: "signed_in", email: user.email ?? null };
      setState(nextState);
      onAuthStateChange?.(nextState);
    });

    return () => subscription.unsubscribe();
  }, [onAuthStateChange]);

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  if (state.status === "loading") {
    return (
      <div className="h-10 w-[5.5rem] rounded-full bg-muted" aria-hidden />
    );
  }

  if (state.status === "signed_out") {
    return (
      <Link
        href="/logg-inn"
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

