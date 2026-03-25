import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SanityPageView } from "@/components/pages/sanity-page";
import { mapPageToMetadata } from "@/lib/seo/page-seo";
import { getSanityContentIndex } from "@/lib/sanity/content";
import { getActivePageBySlug, getActivePageSlugs } from "@/lib/sanity/pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getActivePageSlugs();
  return slugs.filter((item) => item.slug && item.slug !== "home");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getActivePageBySlug(slug);

  if (!page) {
    return {
      title: "Siden finnes ikke",
      description: "Denne siden er ikke tilgjengelig.",
    };
  }

  return mapPageToMetadata(page);
}

export default async function DynamicSanityPage({ params }: PageProps) {
  const { slug } = await params;
  const [page, contentIndex] = await Promise.all([
    getActivePageBySlug(slug),
    getSanityContentIndex(),
  ]);

  if (!page) {
    notFound();
  }

  return <SanityPageView page={page} contentIndex={contentIndex} />;
}
