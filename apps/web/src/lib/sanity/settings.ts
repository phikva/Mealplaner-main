import { sanityClient } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getSiteSettings = async () => {
  return sanityClient.fetch<SiteSettings | null>(siteSettingsQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:settings"] },
  });
};
