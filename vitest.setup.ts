import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

/*
 * vitest.config.ts does not enable `test.globals`, so React Testing
 * Library's own auto-cleanup registration (which looks for a global
 * afterEach) never fires. Without this, each component test's rendered
 * DOM would leak into the next test in the same file.
 */
afterEach(() => {
  cleanup();
});
