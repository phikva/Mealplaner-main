import { cache } from "react";
import { sanityClient } from "@/lib/sanity/client";
import {
  activeHomePageQuery,
  activePageSlugsQuery,
  pageBySlugQuery,
} from "@/lib/sanity/queries";
import type { SanityPage } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getActiveHomePage = cache(async () => {
  return sanityClient.fetch<SanityPage | null>(activeHomePageQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:pages"] },
  });
});

export const getActivePageBySlug = async (slug: string) => {
  return sanityClient.fetch<SanityPage | null>(pageBySlugQuery, { slug }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:pages"] },
  });
};

export const getActivePageSlugs = async () => {
  return sanityClient.fetch<Array<{ slug: string }>>(activePageSlugsQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:pages"] },
  });
};
