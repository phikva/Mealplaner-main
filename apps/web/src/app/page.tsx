import type { Metadata } from "next";
import { SanityPageView } from "@/components/pages/sanity-page";
import { mapPageToMetadata } from "@/lib/seo/page-seo";
import { getSanityContentIndex } from "@/lib/sanity/content";
import { getActiveHomePage } from "@/lib/sanity/pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getActiveHomePage();
  if (!page) {
    return {
      title: "Mealplaner",
      description: "Oppskriftsapp og måltidsplanlegger.",
    };
  }

  return mapPageToMetadata(page);
}

export default async function Home() {
  const [page, contentIndex] = await Promise.all([
    getActiveHomePage(),
    getSanityContentIndex(),
  ]);

  if (!page) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4 px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ingen aktiv hjem-side funnet i Sanity
        </h1>
        <p className="text-muted-foreground">
          Opprett et dokument i <strong>Sider</strong> med sidetype{" "}
          <strong>Hjem</strong> og markert som aktiv.
        </p>
      </main>
    );
  }

  return <SanityPageView page={page} contentIndex={contentIndex} />;
}
