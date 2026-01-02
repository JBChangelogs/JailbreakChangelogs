// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"2026-01-02-3c44d062.mdx": () => import("../dev-changelog/content/2026-01-02-3c44d062.mdx?collection=docs"), "2026-01-02-9e81d76c.mdx": () => import("../dev-changelog/content/2026-01-02-9e81d76c.mdx?collection=docs"), }),
};
export default browserCollections;