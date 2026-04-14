"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteLink } from "@/types/page";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type Props = {
  items: SiteLink[];
  signedIn: boolean;
};

export function MobileNavDrawer({ items, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex h-11 min-w-11 touch-manipulation items-center justify-center rounded-xl border border-border/60 bg-background text-foreground transition-colors hover:bg-muted sm:hidden",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5 shrink-0" aria-hidden />
        <span className="sr-only">Åpne meny</span>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-[59] bg-black/45 backdrop-blur-[2px] sm:hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <Dialog.Content
            id="mobile-nav-drawer"
            className={cn(
              "fixed inset-y-0 right-0 z-[60] flex w-[min(20rem,calc(100vw-1rem))] flex-col border-l border-border/50 bg-background shadow-2xl outline-none sm:hidden",
              "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-200",
            )}
          >
            <Dialog.Description className="sr-only">Navigasjonslenker for nettstedet.</Dialog.Description>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-1 pb-3">
              <Dialog.Title className="text-lg font-semibold tracking-tight text-foreground">Meny</Dialog.Title>
              <button
                type="button"
                className="inline-flex size-10 touch-manipulation items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted"
                onClick={() => setOpen(false)}
                aria-label="Lukk meny"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain py-4" aria-label="Hovedmeny mobil">
              {items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const external = isExternalHref(item.href);
                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer noopener" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-3 py-3 text-base font-semibold tracking-[0.02em] transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/80",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {signedIn ? (
              <div className="shrink-0 border-t border-border/40 pt-3">
                <Link
                  href="/profil"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-center text-base font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted/60"
                >
                  Profil
                </Link>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
