import { sanityClient } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

const toInternalPath = (value: string) => {
  if (value.startsWith("/")) {
    return value;
  }
  return `/${value}`;
};

const resolveLinkHref = (link: NonNullable<SiteSettings["links"]>[number]) => {
  if (link.href) {
    return link.href;
  }

  if (link.linkType === "custom" && link.customHref) {
    return link.customHref.startsWith("http://") || link.customHref.startsWith("https://")
      ? link.customHref
      : toInternalPath(link.customHref);
  }

  if (link.linkType === "page") {
    if (link.page?.pageType === "home") {
      return "/";
    }
    if (link.page?.slug) {
      return toInternalPath(link.page.slug);
    }
  }

  return "";
};

const normalizeSiteSettings = (settings: SiteSettings | null): SiteSettings | null => {
  if (!settings) {
    return null;
  }

  const managedLinks = (settings.links ?? [])
    .map((link) => ({
      label: link.label?.trim() ?? "",
      href: resolveLinkHref(link),
      showInHeader: Boolean(link.showInHeader),
      showInFooter: Boolean(link.showInFooter),
      linkType: link.linkType,
      customHref: link.customHref,
      page: link.page,
    }))
    .filter((link) => link.label.length > 0 && link.href.length > 0);

  return {
    ...settings,
    links: managedLinks,
    header: {
      navigation: managedLinks
        .filter((link) => link.showInHeader)
        .map((link) => ({ label: link.label, href: link.href })),
    },
    footer: {
      text: settings.footer?.text,
      links: managedLinks
        .filter((link) => link.showInFooter)
        .map((link) => ({ label: link.label, href: link.href })),
    },
  };
};

export const getSiteSettings = async () => {
  const settings = await sanityClient.fetch<SiteSettings | null>(siteSettingsQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:settings"] },
  });

  return normalizeSiteSettings(settings);
};
