import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";
import type { HeroBlock } from "@/types/page";

type HeroBlockProps = {
  block: HeroBlock;
};

export const HeroBlockView = ({ block }: HeroBlockProps) => {
  const imageUrl = block.image
    ? urlFor(block.image).width(1600).height(900).fit("crop").url()
    : null;

  return (
    <section className="grid gap-8 rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm md:grid-cols-2 md:items-center md:p-10">
      <div className="space-y-5">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {block.title}
        </h1>
        {block.subtitle && block.subtitle.length > 0 ? (
          <div className="prose prose-zinc max-w-none text-[1.02rem] leading-relaxed dark:prose-invert">
            <PortableText value={block.subtitle} />
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-muted/30 shadow-sm">
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
            src={imageUrl}
            alt={block.title}
            width={1600}
            height={900}
            className="aspect-video h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            priority
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
