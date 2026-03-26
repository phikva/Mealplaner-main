export type PageType =
  | "home"
  | "recipeList"
  | "categoryList"
  | "profile"
  | "settings";

export type PortableTextSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
};

export type PortableTextBlock = {
  _type: "block";
  _key: string;
  style?: string;
  markDefs?: Array<Record<string, unknown>>;
  children?: PortableTextSpan[];
};

export type SanityImageAsset = {
  _ref?: string;
  _type?: "reference";
};

export type SanityImage = {
  _type?: "image";
  asset?: SanityImageAsset;
};

export type PageSeo = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  robots?: {
    noIndex?: boolean;
    noFollow?: boolean;
  };
  openGraph?: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: SanityImage;
  };
  twitter?: {
    cardType?: "summary" | "summary_large_image";
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: SanityImage;
  };
};

export type HeroBlock = {
  _key: string;
  _type: "heroBlock";
  title: string;
  subtitle?: PortableTextBlock[];
  useCta?: boolean;
  ctaCount?: "one" | "two";
  primaryCta?: {
    label?: string;
    href?: string;
  };
  secondaryCta?: {
    label?: string;
    href?: string;
  };
  mediaType?: "image" | "video";
  image?: SanityImage;
  videoUrl?: string;
};

export type RecipeGridBlock = {
  _key: string;
  _type: "recipeGridBlock";
  title: string;
  description?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  kategori?: {
    _ref?: string;
    _id?: string;
    _type?: "reference";
    name?: string;
  };
  layout?: "grid" | "carousel";
  maxItems?: number;
  useCta?: boolean;
  ctaCount?: "one" | "two";
  primaryCta?: {
    label?: string;
    href?: string;
  };
  secondaryCta?: {
    label?: string;
    href?: string;
  };
};

export type UnknownBlock = {
  _key: string;
  _type: string;
};

export type PageContentBlock = HeroBlock | RecipeGridBlock | UnknownBlock;

export type SanityPage = {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  pageType: PageType;
  isActive?: boolean;
  seo?: PageSeo;
  content?: PageContentBlock[];
};

export type SanityRecipe = {
  _id: string;
  tittel: string;
  slug?: { current?: string };
  path?: string;
  image?: SanityImage;
  categories?: SanityCategory[];
  categoryIds?: string[];
  porsjoner?: number;
  totalKcal?: number;
  totalMakros?: {
    protein?: number;
    karbs?: number;
    fett?: number;
  };
  ingrediens?: Array<{
    _key?: string;
    name?: string;
    measurement?: {
      unit?: string;
      unitQuantity?: number;
    };
    mengde?: string;
    kommentar?: string;
  }>;
  instruksjoner?: string[];
  notater?: string;
};

export type SanityCategory = {
  _id: string;
  name: string;
  slug?: { current?: string };
  path?: string;
};

export type SanityTier = {
  _id: string;
  name: string;
  slug?: { current?: string };
  description?: string;
  price?: number;
  isDefault?: boolean;
  recipeAccess?: {
    accessType?: "limited" | "full";
    maxRecipes?: number;
  };
  mealStorage?: {
    storageDuration?: string;
  };
  favoriteRecipes?: {
    canFavorite?: boolean;
    maxFavorites?: string;
  };
  expertMealPlanning?: boolean;
};

export type SanityContentIndex = {
  recipes: SanityRecipe[];
  categories: SanityCategory[];
  tiers: SanityTier[];
};

export type SiteLink = {
  label: string;
  href: string;
};

export type SiteManagedLink = SiteLink & {
  linkType?: "custom" | "page";
  customHref?: string;
  page?: {
    _id?: string;
    title?: string;
    pageType?: PageType;
    slug?: string;
  };
  showInHeader?: boolean;
  showInFooter?: boolean;
};

export type SiteSettings = {
  siteName?: string;
  siteUrl?: string;
  links?: SiteManagedLink[];
  header?: {
    navigation?: SiteLink[];
  };
  footer?: {
    text?: string;
    links?: SiteLink[];
  };
  seo?: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    defaultOgImage?: SanityImage;
    robots?: {
      noIndex?: boolean;
      noFollow?: boolean;
    };
  };
};
