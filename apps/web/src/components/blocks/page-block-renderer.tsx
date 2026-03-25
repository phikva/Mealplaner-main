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

  return blocks.map((block) => {
    const renderer = blockRegistry[block._type];
    if (!renderer) {
      return null;
    }

    return <div key={block._key}>{renderer(block, context)}</div>;
  });
};
