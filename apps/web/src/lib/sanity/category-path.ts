import type { SanityCategory } from "@/types/page";
import { slugifyPathSegment } from "@/lib/path-utils";

export const getCategoryPathFromFields = (category: {
  _id?: string;
  slug?: { current?: string };
  name?: string;
  path?: string;
}) => {
  if (category.slug?.current) {
    return category.slug.current;
  }

  if (category.path) {
    return category.path;
  }

  if (category.name) {
    const slug = slugifyPathSegment(category.name);
    if (slug) {
      return slug;
    }
  }

  return category._id ?? "";
};

export const withCategoryPath = <T extends SanityCategory>(category: T): T => {
  return {
    ...category,
    path: getCategoryPathFromFields(category),
  };
};
