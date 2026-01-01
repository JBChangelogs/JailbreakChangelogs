// source.config.ts
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";
var source_config_default = defineConfig({
  mdxOptions: {
    providerImportSource: "@/mdx-components",
  },
});
var { docs, meta } = defineDocs({
  dir: "dev-changelog/content",
  docs: {
    schema: frontmatterSchema.extend({
      date: z.string(),
      version: z.string().optional(),
    }),
  },
});
export { source_config_default as default, docs, meta };
