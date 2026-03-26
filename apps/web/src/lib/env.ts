const required = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

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
