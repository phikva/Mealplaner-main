import { HeroBlockView } from "@/components/blocks/hero-block";
import { RecipeGridBlockView } from "@/components/blocks/recipe-grid-block";
import type {
  PageContentBlock,
  SanityContentIndex,
} from "@/types/page";

export type BlockRenderContext = {
  contentIndex: SanityContentIndex;
};

type BlockRenderer = (
  block: PageContentBlock,
  context: BlockRenderContext,
) => React.ReactNode;

export const blockRegistry: Record<string, BlockRenderer> = {
  heroBlock: (block, context) => {
    void context
    if (!isHeroBlock(block)) {
      return null;
    }
    return <HeroBlockView block={block} />;
  },
  recipeGridBlock: (block, context) => {
    if (!isRecipeGridBlock(block)) {
      return null;
    }
    return (
      <RecipeGridBlockView
        block={block}
        recipes={context.contentIndex.recipes}
      />
    );
  },
};

const isHeroBlock = (
  block: PageContentBlock,
): block is Extract<PageContentBlock, { _type: "heroBlock" }> => {
  return block._type === "heroBlock";
};

const isRecipeGridBlock = (
  block: PageContentBlock,
): block is Extract<PageContentBlock, { _type: "recipeGridBlock" }> => {
  return block._type === "recipeGridBlock";
};
