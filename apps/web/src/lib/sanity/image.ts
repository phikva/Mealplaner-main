import { createImageUrlBuilder } from "@sanity/image-url";
import { env } from "@/lib/env";

const builder = createImageUrlBuilder({
  projectId: env.nextPublicSanityProjectId,
  dataset: env.nextPublicSanityDataset,
});

type SanityImageSource = Parameters<typeof builder.image>[0];

export const urlFor = (source: SanityImageSource) => builder.image(source);
