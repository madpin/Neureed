import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    // Global test configuration
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
    // Define projects: one for unit tests, one for Storybook
    projects: [
      // Project 1: Unit tests
      {
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
          ],
        },
      },
      // Project 2: Storybook tests
      {
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
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
      },
    ],
  },
  resolve: {
    alias: [
      {
        find: /^@\/lib\/(.*)/,
        replacement: path.resolve(__dirname, "./src/lib/$1"),
      },
      {
        find: /^@\/hooks\/(.*)/,
        replacement: path.resolve(__dirname, "./src/hooks/$1"),
      },
      {
        find: /^@\/components\/(.*)/,
        replacement: path.resolve(__dirname, "./src/components/$1"),
      },
      {
        find: /^@\/app\/(.*)/,
        replacement: path.resolve(__dirname, "./app/$1"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "."),
      },
    ],
  },
});
