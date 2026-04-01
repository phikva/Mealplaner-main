import { urlFor } from "@/lib/sanity/image";
import type { SanityImage } from "@/types/page";

/** Dimensjoner brukt i måltidsplan (modal + måltidsrader). */
export const RECIPE_THUMB_WIDTH = 240;
export const RECIPE_THUMB_HEIGHT = 180;

export function recipeThumbUrl(image: SanityImage | null | undefined): string | null {
  if (!image?.asset) return null;
  return urlFor(image).width(RECIPE_THUMB_WIDTH).height(RECIPE_THUMB_HEIGHT).fit("crop").url();
}
