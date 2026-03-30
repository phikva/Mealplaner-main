import { createClient } from "@/lib/supabase/server";
import { getTiers } from "@/lib/sanity/tiers";

type ProfileRow = {
  id: string;
  email: string | null;
  tier_sanity_id: string | null;
  tier_slug: string | null;
};

export type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

export const ensureProfile = async (supabase?: SupabaseLike) => {
  const client = supabase ?? (await createClient());

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const user = userData.user;

  const { data: existing } = await client
    .from("profiles")
    .select("id,email,tier_sanity_id,tier_slug")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (existing?.tier_sanity_id && existing?.tier_slug) {
    return existing;
  }

  const tiers = await getTiers();
  const defaultTier = tiers.find((t) => t.isDefault) ?? tiers[0];
  const tierSanityId = defaultTier?._id ?? null;
  const tierSlug = defaultTier?.slug?.current ?? null;

  const payload = {
    id: user.id,
    email: user.email ?? null,
    tier_sanity_id: tierSanityId,
    tier_slug: tierSlug,
  };

  const { data: upserted, error: upsertError } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id,email,tier_sanity_id,tier_slug")
    .single<ProfileRow>();

  if (upsertError) {
    return null;
  }

  return upserted;
};

