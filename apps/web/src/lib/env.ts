const required = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Brukes til Supabase `emailRedirectTo`. Når NEXT_PUBLIC_SITE_URL er satt (f.eks. på Vercel),
 * brukes den alltid — da blir ikke lenker i e-post avhengige av nettleserens origin.
 */
export function publicOriginForAuthEmail(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through
    }
  }
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.origin;
}

export const env = {
  nextPublicSupabaseUrl: required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  nextPublicSupabaseAnonKey: required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  nextPublicSanityProjectId: required(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, "NEXT_PUBLIC_SANITY_PROJECT_ID"),
  nextPublicSanityDataset: required(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET"),
  nextPublicSiteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mealplaner.no",
  sanityApiVersion:
    process.env.SANITY_API_VERSION ?? new Date().toISOString().slice(0, 10),
};
