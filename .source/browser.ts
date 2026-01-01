// @ts-nocheck
import { browser } from "fumadocs-mdx/runtime/browser";
import type * as Config from "../source.config";

const create = browser<
  typeof Config,
  import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
    DocData: {};
  }
>();
const browserCollections = {
  docs: create.doc("docs", {
    "2025-12-28.mdx": () =>
      import("../dev-changelog/content/2025-12-28.mdx?collection=docs"),
    "2026-01-01.mdx": () =>
      import("../dev-changelog/content/2026-01-01.mdx?collection=docs"),
  }),
};
export default browserCollections;
