"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayoutProfile } from "@/lib/supabase/session";

type SessionStatus = "loading" | "signed_out" | "signed_in";

type SessionState = {
  status: SessionStatus;
  userId: string | null;
  email: string | null;
  profile: LayoutProfile | null;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<LayoutProfile | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name,diet_values,allergies,kitchen_category_ids,onboarding_completed")
      .eq("id", uid)
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  const syncFromSession = useCallback(
    async (uid: string | null, nextEmail: string | null) => {
      if (!uid) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        setStatus("signed_out");
        return;
      }
      setUserId(uid);
      setEmail(nextEmail);
      setStatus("signed_in");
      await loadProfile(uid);
    },
    [loadProfile],
  );

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      await syncFromSession(user?.id ?? null, user?.email ?? null);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncFromSession(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
  }, [loadProfile, userId]);

  const value = useMemo(
    () => ({ status, userId, email, profile, refreshProfile }),
    [status, userId, email, profile, refreshProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
