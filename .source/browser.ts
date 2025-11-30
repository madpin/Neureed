// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"page.mdx": () => import("../app/docs/page.mdx?collection=docs"), "getting-started/page.mdx": () => import("../app/docs/getting-started/page.mdx?collection=docs"), "getting-started/quick-start.mdx": () => import("../app/docs/getting-started/quick-start.mdx?collection=docs"), "features/saved-searches/user-guide.mdx": () => import("../app/docs/features/saved-searches/user-guide.mdx?collection=docs"), }),
};
export default browserCollections;