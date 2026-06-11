import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type LayoutProfile = {
  full_name?: string | null;
  diet_values?: string[] | null;
  allergies?: string[] | null;
  kitchen_category_ids?: string[] | null;
  onboarding_completed?: boolean | null;
};

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getLayoutProfile = cache(async (userId: string): Promise<LayoutProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name,diet_values,allergies,kitchen_category_ids,onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return data;
});
