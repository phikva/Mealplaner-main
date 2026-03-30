import { PageBlockRenderer } from "@/components/blocks/page-block-renderer";
import { PersonalizedRecipeSection } from "@/components/home/personalized-recipe-section";
import type { SanityContentIndex, SanityPage } from "@/types/page";

type Props = {
  page: SanityPage;
  contentIndex: SanityContentIndex;
};

export const SanityPageView = ({ page, contentIndex }: Props) => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
      <PageBlockRenderer
        blocks={page.content}
        context={{ contentIndex }}
      />
      <PersonalizedRecipeSection contentIndex={contentIndex} />
    </main>
  );
};
