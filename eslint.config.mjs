// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...storybook.configs["flat/recommended"],
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade no-explicit-any from error to warning to allow gradual cleanup
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars that start with underscore (convention for intentionally unused)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "args": "none", // Ignore all unused function arguments (Next.js API routes must match signatures)
          "varsIgnorePattern": "^_",
          "caughtErrors": "none", // Allow error variables in catch blocks (commonly logged/used)
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      // Allow empty catch blocks with a comment
      "no-empty": ["error", { "allowEmptyCatch": true }],
      // Downgrade img element to warning (Next.js Image has limitations for external URLs)
      "@next/next/no-img-element": "warn",
      // Downgrade exhaustive-deps to warning (can be fixed gradually)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
