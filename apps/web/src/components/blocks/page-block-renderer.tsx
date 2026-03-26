import {
  blockRegistry,
  type BlockRenderContext,
} from "@/components/blocks/block-registry";
import type { PageContentBlock } from "@/types/page";

type Props = {
  blocks?: PageContentBlock[];
  context: BlockRenderContext;
};

export const PageBlockRenderer = ({ blocks, context }: Props) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  let recipeGridStreak = 0;

  return blocks.map((block) => {
    const renderer = blockRegistry[block._type];
    if (!renderer) {
      return null;
    }

    const isRecipeGrid = block._type === "recipeGridBlock";
    if (isRecipeGrid) {
      recipeGridStreak += 1;
    } else {
      recipeGridStreak = 0;
    }

    const useAlternateRecipeGridBackground = isRecipeGrid && recipeGridStreak % 2 === 0;

    if (useAlternateRecipeGridBackground) {
      return (
        <div
          key={block._key}
          className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-muted/25"
        >
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            {renderer(block, context)}
          </div>
        </div>
      );
    }

    return <div key={block._key}>{renderer(block, context)}</div>;
  });
};
