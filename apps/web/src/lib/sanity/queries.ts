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
        name,
        slug
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

export const activeOnboardingQuery = groq`
  *[_type == "onboarding" && isActive == true] | order(_updatedAt desc)[0]{
    _id,
    title,
    "slug": slug.current,
    content[]{
      _key,
      _type,
      title,
      body,
      image{
        ...,
        asset
      },
      useCta,
      primaryCta
    }
  }
`;

export const brukerprofilSettingsQuery = groq`
  *[_type == "brukerprofil"][0]{
    kostholdsbehov[]{
      navn,
      verdi,
      beskrivelse
    },
    vanligeAllergier[]{
      navn,
      beskrivelse
    },
    kjokkenTyper[]->{
      _id,
      name,
      slug
    }
  }
`;

/** Slim projection for archive/list pages (no ingredients or long text). */
export const recipesListQuery = groq`
  *[_type == "oppskrift"] | order(tittel asc){
    _id,
    tittel,
    slug,
    dietTags,
    allergens,
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
      "path": slug.current
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

/** Paginated fetch — some API paths cap bulk responses; loop until drained. */
export const recipesListBatchQuery = groq`
  *[_type == "oppskrift"] | order(tittel asc) [$start...$end]{
    _id,
    tittel,
    slug,
    dietTags,
    allergens,
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
      "path": slug.current
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

export const recipesQuery = groq`
  *[_type == "oppskrift"] | order(tittel asc){
    _id,
    tittel,
    slug,
    dietTags,
    allergens,
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
      "path": slug.current
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
    image{
      ...,
      asset
    },
    "path": slug.current
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
    features,
    recipeAccess,
    mealStorage,
    favoriteRecipes,
    expertMealPlanning
  }
`;


/** Samme liste-felter som recipesListQuery (kategorier, filtre) – brukes bl.a. favoritter og måltidsplan. */
export const recipesByIdsQuery = groq`
  *[_type == "oppskrift" && _id in $ids]{
    _id,
    tittel,
    slug,
    dietTags,
    allergens,
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
      "path": slug.current
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

export const recipesSearchByTitleQuery = groq`
  *[_type == "oppskrift" && tittel match $pattern] | order(tittel asc)[0...24]{
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
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

/** Søk med valgfri kategori (tom $categoryId = alle). */
export const recipesSearchByTitleOptionalCategoryQuery = groq`
  *[_type == "oppskrift" && tittel match $pattern && ($categoryId == "" || $categoryId in kategori[]._ref)] | order(tittel asc)[0...24]{
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
    porsjoner,
    totalKcal,
    totalMakros
  }
`;

/** Liste til måltidsplan-velger: alfabetisk, valgfri kategori, maks 36. */
export const recipesBrowseForPickerQuery = groq`
  *[_type == "oppskrift" && ($categoryId == "" || $categoryId in kategori[]._ref)] | order(tittel asc)[0...36]{
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
    porsjoner,
    totalKcal,
    totalMakros
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
    dietTags,
    allergens,
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
      "path": slug.current
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
    _id,
    tittel,
    slug
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
    image{
      ...,
      asset
    },
    "path": slug.current
  }
`;

export const categoryPathsQuery = groq`
  *[_type == "kategori"]{
    _id,
    name,
    slug
  }
`;

export const recipesByCategoryIdQuery = groq`
  *[_type == "oppskrift" && $categoryId in kategori[]._ref] | order(tittel asc){
    _id,
    tittel,
    slug,
    dietTags,
    allergens,
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
      "path": slug.current
    },
    "categoryIds": kategori[]._ref,
    porsjoner,
    totalKcal,
    totalMakros
  }
`;
