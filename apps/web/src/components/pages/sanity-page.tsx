import { PageBlockRenderer } from "@/components/blocks/page-block-renderer";
import { PersonalizedRecipeSection } from "@/components/home/personalized-recipe-section";
import type { HeroViewerState } from "@/lib/tier-access";
import type { SanityContentIndex, SanityPage } from "@/types/page";

type Props = {
  page: SanityPage;
  contentIndex: SanityContentIndex;
  heroViewer?: HeroViewerState;
};

export const SanityPageView = ({ page, contentIndex, heroViewer }: Props) => {
  const blocks = page.content ?? [];
  const first = blocks[0] ? [blocks[0]] : [];
  const rest = blocks.length > 1 ? blocks.slice(1) : [];
  const middle = rest[0] ? [rest[0]] : [];
  const tail = rest.length > 1 ? rest.slice(1) : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
      {first.length > 0 ? (
        <PageBlockRenderer
          blocks={first}
          context={{ contentIndex, heroViewer }}
        />
      ) : null}

      <PersonalizedRecipeSection contentIndex={contentIndex} />

      {middle.length > 0 ? (
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-muted/25">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            <PageBlockRenderer
              blocks={middle}
              context={{ contentIndex }}
            />
          </div>
        </div>
      ) : null}

      {tail.length > 0 ? (
        <PageBlockRenderer
          blocks={tail}
          context={{ contentIndex }}
        />
      ) : null}
    </main>
  );
};
