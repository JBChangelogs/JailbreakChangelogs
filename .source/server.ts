// @ts-nocheck
import * as __fd_glob_3 from "../dev-changelog/content/2026-01-01-ec642c3b.mdx?collection=docs"
import * as __fd_glob_2 from "../dev-changelog/content/2026-01-01-51c6b238.mdx?collection=docs"
import * as __fd_glob_1 from "../dev-changelog/content/2026-01-01-2068b6df.mdx?collection=docs"
import * as __fd_glob_0 from "../dev-changelog/content/2026-01-01-041a84d4.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.doc("docs", "dev-changelog/content", {"2026-01-01-041a84d4.mdx": __fd_glob_0, "2026-01-01-2068b6df.mdx": __fd_glob_1, "2026-01-01-51c6b238.mdx": __fd_glob_2, "2026-01-01-ec642c3b.mdx": __fd_glob_3, });

export const meta = await create.meta("meta", "dev-changelog/content", {});