// @ts-nocheck
import { default as __fd_glob_7 } from "../app/docs/features/saved-searches/_meta.json?collection=docs"
import { default as __fd_glob_6 } from "../app/docs/getting-started/_meta.json?collection=docs"
import { default as __fd_glob_5 } from "../app/docs/features/_meta.json?collection=docs"
import { default as __fd_glob_4 } from "../app/docs/_meta.json?collection=docs"
import * as __fd_glob_3 from "../app/docs/features/saved-searches/user-guide.mdx?collection=docs"
import * as __fd_glob_2 from "../app/docs/getting-started/quick-start.mdx?collection=docs"
import * as __fd_glob_1 from "../app/docs/getting-started/page.mdx?collection=docs"
import * as __fd_glob_0 from "../app/docs/page.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "app/docs", {"_meta.json": __fd_glob_4, "features/_meta.json": __fd_glob_5, "getting-started/_meta.json": __fd_glob_6, "features/saved-searches/_meta.json": __fd_glob_7, }, {"page.mdx": __fd_glob_0, "getting-started/page.mdx": __fd_glob_1, "getting-started/quick-start.mdx": __fd_glob_2, "features/saved-searches/user-guide.mdx": __fd_glob_3, });