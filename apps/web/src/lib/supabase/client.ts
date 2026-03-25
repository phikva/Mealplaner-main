import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export const createClient = () =>
  createBrowserClient(
    env.nextPublicSupabaseUrl,
    env.nextPublicSupabaseAnonKey,
  );
