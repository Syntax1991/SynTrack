import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /*
     * jsdom for everything: component-rendering tests (.test.tsx) need a
     * real DOM to mount into, and plain .test.ts logic tests run
     * unaffected under jsdom (it's a superset of the Node globals they
     * use).
     */
    environment: "jsdom",
    setupFiles: [
      "./vitest.setup.ts"
    ],
    include: [
      "modules/**/*.test.ts",
      "modules/**/*.test.tsx",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx"
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**"
    ]
  }
});
