import { cache } from "react";
import { sanityClient } from "@/lib/sanity/client";
import { brukerprofilSettingsQuery } from "@/lib/sanity/queries";
import type { BrukerprofilSettings } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getBrukerprofilSettings = cache(async () => {
  return await sanityClient.fetch<BrukerprofilSettings | null>(
    brukerprofilSettingsQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:brukerprofil"] },
    },
  );
});

