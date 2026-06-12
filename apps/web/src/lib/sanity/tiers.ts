import { cache } from "react";
import { sanityClient } from "@/lib/sanity/client";
import { tiersQuery } from "@/lib/sanity/queries";
import type { SanityTier } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getTiers = cache(async () => {
  return sanityClient.fetch<SanityTier[]>(tiersQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:tiers"] },
  });
});

