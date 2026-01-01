import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

export default defineConfig({
  mdxOptions: {
    providerImportSource: "@/mdx-components",
  },
});

export const { docs, meta } = defineDocs({
  dir: "dev-changelog/content",
  docs: {
    schema: frontmatterSchema.extend({
      date: z.string(),
      version: z.string().optional(),
      commitUrl: z.string().optional(),
    }),
  },
});
