"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

const copy: Record<
  Mode,
  { title: string; lead: string; emailLabel: string; placeholder: string; submitIdle: string; submitSending: string; success: string; altPrompt: string; altHref: string; altLabel: string }
> = {
  login: {
    title: "Logg inn",
    lead: "Vi sender deg en magic link på e-post.",
    emailLabel: "E-post",
    placeholder: "deg@eksempel.no",
    submitIdle: "Send innloggingslenke",
    submitSending: "Sender…",
    success: "Sjekk e-posten din for innloggingslenke.",
    altPrompt: "Har du ikke konto?",
    altHref: "/registrering",
    altLabel: "Registrer deg",
  },
  register: {
    title: "Registrer deg",
    lead: "Opprett konto med e-post. Vi sender deg en lenke for å bekrefte og logge inn.",
    emailLabel: "E-post",
    placeholder: "deg@eksempel.no",
    submitIdle: "Send registreringslenke",
    submitSending: "Sender…",
    success: "Sjekk e-posten din for å fullføre registreringen.",
    altPrompt: "Har du allerede konto?",
    altHref: "/logg-inn",
    altLabel: "Logg inn",
  },
};

type MagicLinkFormProps = {
  mode: Mode;
};

export function MagicLinkForm({ mode }: MagicLinkFormProps) {
  const c = copy[mode];
  const [method, setMethod] = useState<"magic" | "password">(mode === "login" ? "password" : "magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Skriv inn en gyldig e-postadresse.");
      return;
    }

    const supabase = createClient();

    if (mode === "login" && method === "password") {
      if (!password) {
        setStatus("error");
        setMessage("Skriv inn passordet ditt.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      const user = data.user;
      if (user) {
        await fetch("/api/ensure-profile", { method: "POST" });
      }

      window.location.assign("/?onboarding=1");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(c.success);
  };

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="text-sm text-muted-foreground">{c.lead}</p>
      </header>

      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border border-border/60 bg-background/85 p-5 shadow-sm">
        {mode === "login" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("password")}
              className={
                method === "password"
                  ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              }
            >
              Passord
            </button>
            <button
              type="button"
              onClick={() => setMethod("magic")}
              className={
                method === "magic"
                  ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              }
            >
              Magic link
            </button>
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">{c.emailLabel}</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={c.placeholder}
            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {mode === "login" && method === "password" ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Passord</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold tracking-[0.02em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {status === "sending"
            ? c.submitSending
            : mode === "login" && method === "password"
              ? "Logg inn"
              : c.submitIdle}
        </button>

        {message ? (
          <p
            className={
              status === "error"
                ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
                : "rounded-lg border border-emerald-600/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            }
          >
            {message}
          </p>
        ) : null}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {c.altPrompt}{" "}
        <Link href={c.altHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {c.altLabel}
        </Link>
      </p>
    </>
  );
}
