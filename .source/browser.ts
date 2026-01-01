// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"2026-01-01-041a84d4.mdx": () => import("../dev-changelog/content/2026-01-01-041a84d4.mdx?collection=docs"), "2026-01-01-2068b6df.mdx": () => import("../dev-changelog/content/2026-01-01-2068b6df.mdx?collection=docs"), "2026-01-01-51c6b238.mdx": () => import("../dev-changelog/content/2026-01-01-51c6b238.mdx?collection=docs"), "2026-01-01-ec642c3b.mdx": () => import("../dev-changelog/content/2026-01-01-ec642c3b.mdx?collection=docs"), }),
};
export default browserCollections;