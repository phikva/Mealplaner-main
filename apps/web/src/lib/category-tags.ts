import type { SanityCategory } from "@/types/page";
import { getCategoryPathFromFields } from "@/lib/sanity/category-path";

export const getCategoryTagClassName = (categoryName: string) => {
  if (!categoryName) {
    return "border border-border/80 bg-transparent text-foreground";
  }
  return "border border-border/80 bg-transparent text-foreground";
};

export const getCategoryHref = (category: SanityCategory) => {
  const path = getCategoryPathFromFields(category);
  return path ? `/kategori/${path}` : "/kategori";
};
