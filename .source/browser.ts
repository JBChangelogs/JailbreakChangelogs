// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"2026-01-02-5b1538fb.mdx": () => import("../dev-changelog/content/2026-01-02-5b1538fb.mdx?collection=docs"), }),
};
export default browserCollections;