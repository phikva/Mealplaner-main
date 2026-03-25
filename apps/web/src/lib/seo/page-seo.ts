import type { Metadata } from "next";
import { env } from "@/lib/env";
import { urlFor } from "@/lib/sanity/image";
import type { SanityPage } from "@/types/page";

const buildRobots = (page: SanityPage): Metadata["robots"] => {
  const noIndex = page.seo?.robots?.noIndex ?? false;
  const noFollow = page.seo?.robots?.noFollow ?? false;

  return {
    index: !noIndex,
    follow: !noFollow,
  };
};

const buildAbsoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return new URL(pathOrUrl, env.nextPublicSiteUrl).toString();
};

export const mapPageToMetadata = (page: SanityPage): Metadata => {
  const metaTitle = page.seo?.metaTitle ?? page.title;
  const metaDescription =
    page.seo?.metaDescription ?? "Oppskriftsapp og måltidsplanlegger.";

  const ogImage = page.seo?.openGraph?.ogImage;
  const twitterImage = page.seo?.twitter?.twitterImage;
  const ogImageUrl = ogImage
    ? urlFor(ogImage).width(1200).height(630).fit("crop").url()
    : undefined;
  const twitterImageUrl = twitterImage
    ? urlFor(twitterImage).width(1200).height(630).fit("crop").url()
    : ogImageUrl;

  const canonical =
    page.seo?.canonicalUrl ?? `/${page.slug?.current ? page.slug.current : ""}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: buildAbsoluteUrl(canonical),
    },
    robots: buildRobots(page),
    openGraph: {
      title: page.seo?.openGraph?.ogTitle ?? metaTitle,
      description: page.seo?.openGraph?.ogDescription ?? metaDescription,
      url: buildAbsoluteUrl(canonical),
      type: "website",
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: page.seo?.twitter?.cardType ?? "summary_large_image",
      title:
        page.seo?.twitter?.twitterTitle ?? page.seo?.openGraph?.ogTitle ?? metaTitle,
      description:
        page.seo?.twitter?.twitterDescription ??
        page.seo?.openGraph?.ogDescription ??
        metaDescription,
      images: twitterImageUrl ? [twitterImageUrl] : undefined,
    },
  };
};
