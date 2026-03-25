import { PageBlockRenderer } from "@/components/blocks/page-block-renderer";
import type { SanityContentIndex, SanityPage } from "@/types/page";

type Props = {
  page: SanityPage;
  contentIndex: SanityContentIndex;
};

export const SanityPageView = ({ page, contentIndex }: Props) => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <PageBlockRenderer
        blocks={page.content}
        context={{ contentIndex }}
      />
    </main>
  );
};
