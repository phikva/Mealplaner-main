"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { cn } from "@/lib/utils";

type Props = {
  recipeSanityId: string;
  initialFavorited: boolean;
  canFavorite: boolean;
  /** Når max er nådd og oppskriften ikke allerede er favoritt */
  blockAdd: boolean;
  isAuthenticated: boolean;
  /** `icon` = kun hjerte (arkiv grid/liste); `full` = knapp med tekst (oppskriftside) */
  variant?: "full" | "icon";
  className?: string;
};

export function RecipeFavoriteButton({
  recipeSanityId,
  initialFavorited,
  canFavorite,
  blockAdd,
  isAuthenticated,
  variant = "full",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const loginHref = `/logg-inn?next=${encodeURIComponent(pathname || "/")}`;
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  const runToggle = useCallback(() => {
    if (blockAdd && !favorited) {
      toast.error("Du har nådd maks antall favoritter for abonnementet ditt.");
      return;
    }
    startTransition(async () => {
      const res = await toggleFavoriteAction(recipeSanityId);
      if (!res.ok) {
        if (res.error === "at_limit") {
          toast.error("Du har nådd maks antall favoritter for abonnementet ditt.");
        } else if (res.error === "tier_denied") {
          toast.error("Favoritter er ikke inkludert i abonnementet ditt.");
        } else if (res.error === "not_authenticated") {
          toast.error("Du må være innlogget for å bruke favoritter.");
        } else {
          toast.error("Kunne ikke oppdatere favoritt. Prøv igjen.");
        }
        router.refresh();
        return;
      }
      if (res.favorited) {
        toast.success("Lagret som favoritt");
      } else {
        toast.success("Fjernet fra favoritter");
      }
      setFavorited(res.favorited);
      router.refresh();
    });
  }, [blockAdd, favorited, recipeSanityId, router]);

  const iconButtonClass = cn(
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    favorited
      ? "border-primary/45 bg-primary/15 text-primary hover:bg-primary/22"
      : "border-border/70 bg-background/92 text-foreground hover:bg-background",
    className,
  );

  if (!isAuthenticated) {
    if (variant === "icon") {
      return (
        <Link
          href={loginHref}
          className={cn(iconButtonClass, "text-foreground")}
          aria-label="Logg inn for å lagre favoritter"
          title="Logg inn for favoritter"
        >
          <Heart className="size-[1.15rem]" aria-hidden />
        </Link>
      );
    }
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted"
      >
        <Heart className="size-4" aria-hidden />
        Logg inn for favoritter
      </Link>
    );
  }

  if (!canFavorite) {
    if (variant === "icon") {
      return (
        <span
          className={cn(
            "inline-flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border/60 bg-muted/45 text-muted-foreground opacity-70 shadow-sm backdrop-blur-md",
            className,
          )}
          title="Favoritter er ikke inkludert i abonnementet ditt"
          aria-label="Favoritter er ikke inkludert i abonnementet ditt"
        >
          <Heart className="size-[1.15rem]" aria-hidden />
        </span>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        Favoritter er ikke inkludert i abonnementet ditt.{" "}
        <Link href="/abonnement" className="font-semibold text-primary underline-offset-4 hover:underline">
          Se planer
        </Link>
      </p>
    );
  }

  const disabled = pending;

  if (variant === "icon") {
    return (
      <button
        type="button"
        disabled={disabled}
        title={
          blockAdd && !favorited
            ? "Maks antall favoritter nådd"
            : favorited
              ? "Fjern favoritt"
              : "Legg til favoritt"
        }
        aria-label={favorited ? "Fjern favoritt" : "Legg til favoritt"}
        aria-pressed={favorited}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          runToggle();
        }}
        className={cn(iconButtonClass, disabled && "opacity-55")}
      >
        <Heart className={cn("size-[1.15rem]", favorited && "fill-primary text-primary")} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => runToggle()}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition",
        favorited
          ? "border-primary/40 bg-primary/12 text-primary hover:bg-primary/18"
          : "border-border/60 bg-background hover:bg-muted",
        disabled && "opacity-60",
        className,
      )}
    >
      <Heart className={cn("size-4", favorited && "fill-primary text-primary")} aria-hidden />
      {favorited ? "Fjern favoritt" : "Legg til favoritt"}
      {blockAdd && !favorited ? (
        <span className="text-xs font-normal text-muted-foreground">(maks nådd)</span>
      ) : null}
    </button>
  );
}
