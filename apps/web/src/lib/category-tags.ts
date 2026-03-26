import type { SanityCategory } from "@/types/page";

export const getCategoryTagClassName = (categoryName: string) => {
  if (!categoryName) {
    return "border border-border/80 bg-transparent text-foreground";
  }
  return "border border-border/80 bg-transparent text-foreground";
};

export const getCategoryHref = (category: SanityCategory) => {
  const path = category.path || category.slug?.current || category._id;
  return `/kategori/${path}`;
};
