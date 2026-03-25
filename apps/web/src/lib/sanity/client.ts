import { createClient } from "next-sanity";
import { env } from "@/lib/env";

export const sanityClient = createClient({
  projectId: env.nextPublicSanityProjectId,
  dataset: env.nextPublicSanityDataset,
  apiVersion: env.sanityApiVersion,
  useCdn: true,
});
