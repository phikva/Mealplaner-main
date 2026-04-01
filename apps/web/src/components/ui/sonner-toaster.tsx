"use client";

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

export function SonnerToaster() {
  return (
    <Toaster
      theme="light"
      position="top-center"
      closeButton
      offset="5rem"
      gap={12}
      visibleToasts={4}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: cn(
            "items-start !gap-3 !p-4 !pr-11 !text-sm !leading-snug !shadow-none",
            "![background:color-mix(in_oklab,var(--card)_96%,transparent)]",
            "!backdrop-blur-md !backdrop-saturate-150",
            "!border !border-border/55",
            "!rounded-2xl",
            "[box-shadow:0_12px_40px_-12px_color-mix(in_oklab,var(--foreground)_14%,transparent)]",
          ),
          title: "!font-semibold !text-foreground !text-[0.9375rem] !leading-snug !tracking-tight",
          description: "!text-muted-foreground !text-xs !leading-relaxed !font-normal",
          icon: "!mt-0.5 !size-[1.125rem] shrink-0 !text-muted-foreground",
          closeButton: cn(
            "!rounded-xl !size-8 !border !border-border/50",
            "![background:color-mix(in_oklab,var(--background)_88%,transparent)]",
            "!text-foreground hover:![background:var(--muted)]",
            "!left-auto !right-2.5 !top-2.5 !translate-x-0 !translate-y-0",
          ),
          success: cn(
            "!border-l-[3px] !border-l-primary !pl-3.5",
            "[&_[data-icon]]:!text-primary",
          ),
          error: cn(
            "!border-l-[3px] !border-l-destructive !pl-3.5",
            "[&_[data-icon]]:!text-destructive",
          ),
          info: cn(
            "!border-l-[3px] !pl-3.5",
            "!border-l-[color-mix(in_oklab,var(--ring)_75%,var(--border))]",
            "[&_[data-icon]]:!text-secondary-foreground",
          ),
          warning: cn(
            "!border-l-[3px] !border-l-amber-600/85 !pl-3.5",
            "[&_[data-icon]]:!text-amber-700 dark:[&_[data-icon]]:!text-amber-500",
          ),
        },
      }}
      className="font-sans"
    />
  );
}
