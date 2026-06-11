import type { SanityTier } from "@/types/page";

/** Parser max antall favoritter fra Sanity (tekstfelt). */
export function parseMaxFavorites(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const t = raw.trim().toLowerCase();
  if (t === "unlimited" || t === "ubegrenset" || t === "∞" || t === "uendelig") {
    return null;
  }
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parser lagringsvarighet fra Sanity (tekstfelt, antall dager eller uendelig). */
export function parseMealStorageDays(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const t = raw.trim().toLowerCase();
  if (t === "unlimited" || t === "ubegrenset" || t === "∞" || t === "uendelig") {
    return null;
  }
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getMealStorageRules(tier: SanityTier | null): {
  maxDays: number | null;
} {
  if (!tier) return { maxDays: null };
  return { maxDays: parseMealStorageDays(tier.mealStorage?.storageDuration) };
}

export function getFavoriteRules(tier: SanityTier | null): {
  canFavorite: boolean;
  maxFavorites: number | null;
} {
  if (!tier) {
    return { canFavorite: true, maxFavorites: null };
  }
  const fr = tier.favoriteRecipes;
  if (fr?.canFavorite === false) {
    return { canFavorite: false, maxFavorites: null };
  }
  return {
    canFavorite: true,
    maxFavorites: parseMaxFavorites(fr?.maxFavorites),
  };
}

export function resolveTierForProfile(
  tiers: SanityTier[],
  tierSanityId: string | null | undefined,
  tierSlug: string | null | undefined,
): SanityTier | null {
  if (tierSanityId) {
    const byId = tiers.find((t) => t._id === tierSanityId);
    if (byId) return byId;
  }
  if (tierSlug) {
    const bySlug = tiers.find((t) => t.slug?.current === tierSlug);
    if (bySlug) return bySlug;
  }
  return tiers.find((t) => t.isDefault) ?? tiers[0] ?? null;
}

export type HeroViewerState =
  | { loggedIn: false }
  | {
      loggedIn: true;
      tierName: string;
      statusMessage: string;
      showUpgradeCta: boolean;
    };

export function isPremiumTier(tier: SanityTier | null): boolean {
  if (!tier) return false;
  return tier.slug?.current === "premium";
}

/** Hero på forsiden: skjul «Kom i gang gratis» for innloggede, vis abonnementstekst/oppgradering. */
export function getHeroViewerState(
  tiers: SanityTier[],
  profile: { tier_sanity_id?: string | null; tier_slug?: string | null } | null,
): HeroViewerState {
  const tier = resolveTierForProfile(tiers, profile?.tier_sanity_id, profile?.tier_slug);
  const tierName = tier?.name ?? "Trial";
  const slug = tier?.slug?.current ?? "trial";

  if (isPremiumTier(tier)) {
    return {
      loggedIn: true,
      tierName,
      statusMessage: `Du har ${tierName} – full tilgang til alle funksjoner.`,
      showUpgradeCta: false,
    };
  }

  if (slug === "basis") {
    return {
      loggedIn: true,
      tierName,
      statusMessage: `Du har ${tierName}. Oppgrader til Premium for ubegrenset tilgang.`,
      showUpgradeCta: true,
    };
  }

  return {
    loggedIn: true,
    tierName,
    statusMessage: `Du er på ${tierName}. Oppgrader for flere oppskrifter og lengre måltidsplan.`,
    showUpgradeCta: true,
  };
}
