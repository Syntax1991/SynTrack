import { describe, expect, it } from "vitest";
import {
  productionApiBaseUrl,
  resolveApiBaseUrl
} from "./apiBaseUrl";

describe("resolveApiBaseUrl", () => {
  it("uses the same-origin production API when VITE_API_URL is unset or empty", () => {
    expect(resolveApiBaseUrl(undefined, productionApiBaseUrl)).toBe("/api");
    expect(resolveApiBaseUrl("", productionApiBaseUrl)).toBe("/api");
    expect(resolveApiBaseUrl("   ", productionApiBaseUrl)).toBe("/api");
    expect(productionApiBaseUrl).not.toContain("localhost");
  });

  it("keeps the caller's development fallback for the Vite dev server", () => {
    expect(resolveApiBaseUrl(undefined, "http://localhost:4000/api")).toBe("http://localhost:4000/api");
  });

  it("lets an explicit VITE_API_URL win and trims trailing slashes", () => {
    expect(resolveApiBaseUrl("https://syntrack.io/api/", productionApiBaseUrl)).toBe("https://syntrack.io/api");
  });
});
