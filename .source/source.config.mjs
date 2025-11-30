// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
var source_config_default = defineConfig();
var docs = defineDocs({
  dir: "app/docs"
});
export {
  source_config_default as default,
  docs
};
