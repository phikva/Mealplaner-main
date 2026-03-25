import groq from "groq";

const pageProjection = `{
  _id,
  title,
  slug,
  pageType,
  isActive,
  seo{
    ...,
    openGraph{
      ...,
      ogImage{
        ...,
        asset
      }
    },
    twitter{
      ...,
      twitterImage{
        ...,
        asset
      }
    }
  },
  content[]{
    ...,
    _type == "heroBlock" => {
      ...,
      image{
        ...,
        asset
      }
    },
    _type == "recipeGridBlock" => {
      ...,
      kategori->{
        _id,
        name
      }
    }
  }
}`;

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug && isActive == true][0]${pageProjection}
`;

export const activeHomePageQuery = groq`
  *[_type == "page" && pageType == "home" && isActive == true][0]${pageProjection}
`;

export const activePageSlugsQuery = groq`
  *[_type == "page" && isActive == true && defined(slug.current)]{
    "slug": slug.current
  }
`;

export const recipesQuery = groq`
  *[_type == "oppskrift"] | order(tittel asc){
    _id,
    tittel,
    image{
      ...,
      asset
    },
    "categories": kategori[]->{
      _id,
      name
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

export const categoriesQuery = groq`
  *[_type == "kategori"] | order(name asc){
    _id,
    name
  }
`;

export const tiersQuery = groq`
  *[_type == "tier"] | order(price asc){
    _id,
    name,
    slug,
    description,
    price,
    isDefault,
    recipeAccess,
    mealStorage,
    favoriteRecipes,
    expertMealPlanning
  }
`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    siteName,
    siteUrl,
    header{
      navigation[]{
        label,
        href
      }
    },
    footer{
      text,
      links[]{
        label,
        href
      }
    },
    seo{
      defaultMetaTitle,
      defaultMetaDescription,
      defaultOgImage{
        ...,
        asset
      },
      robots
    }
  }
`;
