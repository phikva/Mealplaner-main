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
    slug,
    "path": select(
      defined(slug.current) => slug.current,
      _id
    ),
    image{
      ...,
      asset
    },
    "categories": kategori[]->{
      _id,
      name,
      slug,
      "path": select(
        defined(slug.current) => slug.current,
        _id
      )
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros,
    ingrediens[]{
      _key,
      name,
      measurement,
      mengde,
      kommentar
    },
    instruksjoner,
    notater
  }
`;

export const categoriesQuery = groq`
  *[_type == "kategori"] | order(name asc){
    _id,
    name,
    slug,
    "path": select(
      defined(slug.current) => slug.current,
      _id
    )
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
    links[]{
      label,
      linkType,
      customHref,
      "page": page->{
        _id,
        title,
        pageType,
        "slug": slug.current
      },
      showInHeader,
      showInFooter,
      "href": select(
        linkType == "custom" => customHref,
        page->pageType == "home" => "/",
        defined(page->slug.current) => "/" + page->slug.current,
        "/"
      )
    },
    header{
      "navigation": ^.links[showInHeader == true]{
        label,
        "href": select(
          linkType == "custom" => customHref,
          page->pageType == "home" => "/",
          defined(page->slug.current) => "/" + page->slug.current,
          "/"
        )
      }
    },
    footer{
      text,
      "links": ^.links[showInFooter == true]{
        label,
        "href": select(
          linkType == "custom" => customHref,
          page->pageType == "home" => "/",
          defined(page->slug.current) => "/" + page->slug.current,
          "/"
        )
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

export const recipeByPathQuery = groq`
  *[
    _type == "oppskrift" &&
    (slug.current == $path || _id == $path)
  ][0]{
    _id,
    tittel,
    slug,
    "path": select(
      defined(slug.current) => slug.current,
      _id
    ),
    image{
      ...,
      asset
    },
    "categories": kategori[]->{
      _id,
      name,
      slug,
      "path": select(
        defined(slug.current) => slug.current,
        _id
      )
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros,
    ingrediens[]{
      _key,
      name,
      measurement,
      mengde,
      kommentar
    },
    instruksjoner,
    notater
  }
`;

export const recipePathsQuery = groq`
  *[_type == "oppskrift"]{
    "path": select(
      defined(slug.current) => slug.current,
      _id
    )
  }
`;

export const categoryByPathQuery = groq`
  *[
    _type == "kategori" &&
    (slug.current == $path || _id == $path)
  ][0]{
    _id,
    name,
    slug,
    "path": select(
      defined(slug.current) => slug.current,
      _id
    )
  }
`;

export const categoryPathsQuery = groq`
  *[_type == "kategori"]{
    "path": select(
      defined(slug.current) => slug.current,
      _id
    )
  }
`;

export const recipesByCategoryIdQuery = groq`
  *[_type == "oppskrift" && $categoryId in kategori[]._ref] | order(tittel asc){
    _id,
    tittel,
    slug,
    "path": select(
      defined(slug.current) => slug.current,
      _id
    ),
    image{
      ...,
      asset
    },
    "categories": kategori[]->{
      _id,
      name,
      slug,
      "path": select(
        defined(slug.current) => slug.current,
        _id
      )
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;
