// @ts-nocheck
import * as __fd_glob_0 from "../dev-changelog/content/2026-01-02-5b1538fb.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.doc("docs", "dev-changelog/content", {"2026-01-02-5b1538fb.mdx": __fd_glob_0, });

export const meta = await create.meta("meta", "dev-changelog/content", {});