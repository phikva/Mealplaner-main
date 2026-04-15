"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * PKCE code-verifier ligger i nettleserens cookies etter signInWithOtp.
 * Utveksling må skje i klienten (samme lagring som ved OTP-start), ellers blir
 * ikke sesjonen satt selv om du lander på /?onboarding=1 etter redirect.
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Logger inn…");

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
      router.replace("/");
      return;
    }

    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage("");
        router.replace(`/logg-inn?auth_error=${encodeURIComponent(error.message)}`);
        return;
      }

      await fetch("/api/ensure-profile", { method: "POST" });

      const dest = new URL(next, window.location.origin);
      dest.searchParams.set("onboarding", "1");
      window.location.assign(dest.pathname + dest.search + dest.hash);
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {message ? <p>{message}</p> : null}
    </div>
  );
}
