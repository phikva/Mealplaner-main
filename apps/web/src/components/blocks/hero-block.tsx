import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";
import type { HeroViewerState } from "@/lib/tier-access";
import type { HeroBlock } from "@/types/page";

type HeroBlockProps = {
  block: HeroBlock;
  viewer?: HeroViewerState;
};

export const HeroBlockView = ({ block, viewer }: HeroBlockProps) => {
  const assetRef = block.image?.asset?._ref || "";
  const isGif = assetRef.endsWith("-gif");
  const originalImageUrl = block.image ? urlFor(block.image).url() : null;
  const imageUrl = block.image
    ? urlFor(block.image).width(1600).height(900).fit("crop").url()
    : null;
  const loggedIn = viewer?.loggedIn === true;
  const showUpgradeCta = loggedIn && viewer.showUpgradeCta;
  const showGuestPrimaryCta =
    !loggedIn && Boolean(block.useCta && block.primaryCta?.label && block.primaryCta?.href);
  const showPrimaryCta = showUpgradeCta || showGuestPrimaryCta;
  const primaryLabel = showUpgradeCta ? "Oppgrader" : block.primaryCta?.label;
  const primaryHref = showUpgradeCta ? "/abonnement" : block.primaryCta?.href;
  const showSecondaryCta = Boolean(
    block.useCta &&
      block.ctaCount === "two" &&
      block.secondaryCta?.label &&
      block.secondaryCta?.href,
  );

  const isExternalLink = (href: string) => href.startsWith("http://") || href.startsWith("https://");

  return (
    <section className="grid gap-8 py-6 md:grid-cols-2 md:items-center md:py-10">
      <div className="space-y-5">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {block.title}
        </h1>
        {block.subtitle && block.subtitle.length > 0 ? (
          <div className="prose prose-zinc max-w-none text-[1.02rem] leading-relaxed dark:prose-invert">
            <PortableText value={block.subtitle} />
          </div>
        ) : null}
        {loggedIn ? (
          <p className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground">
            {viewer.statusMessage}
          </p>
        ) : null}
        {showPrimaryCta || showSecondaryCta ? (
          <div
            className={cn(
              "flex gap-3 pt-2",
              showPrimaryCta && showSecondaryCta
                ? "flex-col md:flex-row md:flex-wrap md:items-center [&>a]:w-full md:[&>a]:w-auto"
                : "flex flex-wrap items-center",
            )}
          >
            {showPrimaryCta ? (
              <Link
                href={primaryHref || "/"}
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-semibold tracking-[0.02em] text-primary-foreground transition-all hover:bg-primary/90"
                target={
                  primaryHref && isExternalLink(primaryHref) ? "_blank" : undefined
                }
                rel={
                  primaryHref && isExternalLink(primaryHref) ? "noreferrer noopener" : undefined
                }
              >
                {primaryLabel}
              </Link>
            ) : null}
            {showSecondaryCta ? (
              <Link
                href={block.secondaryCta?.href || "/"}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-foreground/35 px-7 py-3 text-center text-base font-semibold tracking-[0.02em] text-foreground transition-all hover:border-foreground hover:gap-3"
                target={
                  block.secondaryCta?.href && isExternalLink(block.secondaryCta.href)
                    ? "_blank"
                    : undefined
                }
                rel={
                  block.secondaryCta?.href && isExternalLink(block.secondaryCta.href)
                    ? "noreferrer noopener"
                    : undefined
                }
              >
                {block.secondaryCta?.label}
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={isGif ? "overflow-hidden" : "overflow-hidden bg-muted/35"}>
        {block.mediaType === "video" && block.videoUrl ? (
          <iframe
            title={block.title}
            src={block.videoUrl}
            className="aspect-video h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : imageUrl ? (
          <Image
            src={isGif && originalImageUrl ? originalImageUrl : imageUrl}
            alt={block.title}
            width={1600}
            height={900}
            className={`w-full transition-transform duration-700 ${
              isGif ? "h-auto object-contain" : "aspect-video h-full object-cover hover:scale-[1.02]"
            }`}
            priority
            unoptimized={isGif}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            Ingen media valgt
          </div>
        )}
      </div>
    </section>
  );
};
