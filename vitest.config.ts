import { defineConfig, defineProject } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

/** Match tsconfig: `@/app/*` -> ./app/*, `@/*` -> ./src/* */
const tsconfigPathAliases = [
  {
    find: /^@\/app\/(.*)/,
    replacement: `${path.resolve(dirname, "app")}/$1`,
  },
  {
    find: /^@\/(.*)/,
    replacement: `${path.resolve(dirname, "src")}/$1`,
  },
];

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.ts",
        "**/*.config.js",
        "**/types/**",
        ".next/",
        "prisma/",
        "**/*.d.ts",
        ".storybook/",
        "src/stories/",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    projects: [
      defineProject({
        plugins: [react()],
        resolve: {
          alias: tsconfigPathAliases,
        },
        test: {
          name: "unit",
          environment: "happy-dom",
          setupFiles: ["./tests/setup.ts"],
          globals: true,
          include: [
            "tests/**/*.{test,spec}.{ts,tsx}",
            "app/**/*.{test,spec}.{ts,tsx}",
            "src/**/*.{test,spec}.{ts,tsx}",
          ],
          exclude: [
            "node_modules",
            ".next",
            "dist",
            "coverage",
            "**/*.stories.{ts,tsx}",
            ".storybook",
            // Require a real Postgres; run locally or in a dedicated integration job
            "src/lib/services/__tests__/saved-search*.test.ts",
          ],
        },
      }),
      defineProject({
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      }),
    ],
  },
});
