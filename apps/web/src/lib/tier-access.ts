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
