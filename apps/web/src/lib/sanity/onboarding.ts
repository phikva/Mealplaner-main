import { cache } from "react";
import { sanityClient } from "@/lib/sanity/client";
import { activeOnboardingQuery } from "@/lib/sanity/queries";
import type { ActiveOnboardingDocument } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getActiveOnboarding = cache(async () => {
  const doc = await sanityClient.fetch<ActiveOnboardingDocument | null>(
    activeOnboardingQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:onboarding"] },
    },
  );

  if (!doc?.content?.length) {
    return null;
  }

  return doc;
});
