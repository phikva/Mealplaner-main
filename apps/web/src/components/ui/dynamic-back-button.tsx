"use client";

import { useMemo } from "react";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  defaultHref?: string;
  label?: string;
  className?: string;
};

export const DynamicBackButton = ({
  defaultHref = "/",
  label = "Tilbake",
  className,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const resolvedBackHref = useMemo(() => {
    if (typeof window === "undefined") {
      return defaultHref;
    }

    const fromParam = new URLSearchParams(window.location.search).get("from");
    if (fromParam && fromParam.startsWith("/") && !fromParam.startsWith("//") && fromParam !== pathname) {
      return fromParam;
    }

    const { referrer } = document;
    if (!referrer) {
      return defaultHref;
    }

    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.origin !== window.location.origin) {
        return defaultHref;
      }

      const nextHref = `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;
      if (!nextHref || nextHref === pathname) {
        return defaultHref;
      }

      return nextHref;
    } catch {
      return defaultHref;
    }
  }, [defaultHref, pathname]);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push(resolvedBackHref);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "inline-flex items-center gap-2 border border-border/70 px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground md:text-sm"
      }
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </button>
  );
};
