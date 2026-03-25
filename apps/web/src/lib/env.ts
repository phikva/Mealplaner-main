const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nextPublicSupabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  nextPublicSupabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  nextPublicSanityProjectId: required("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  nextPublicSanityDataset: required("NEXT_PUBLIC_SANITY_DATASET"),
  nextPublicSiteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mealplaner.no",
  sanityApiVersion:
    process.env.SANITY_API_VERSION ?? new Date().toISOString().slice(0, 10),
};
