import { describe, expect, it } from "vitest";
import { deviceConnectionStartSchema } from "./device-link.validation.js";

describe("deviceConnectionStartSchema", () => {
  it("accepts realistic Windows machine names", () => {
    for (const deviceName of ["DESKTOP-AB12CD3", "Büro-PC ✓", "CertificationTest"]) {
      expect(deviceConnectionStartSchema.parse({ deviceName }).deviceName).toBe(deviceName);
    }
  });

  it("accepts a missing or null device name", () => {
    expect(deviceConnectionStartSchema.parse({}).deviceName).toBeUndefined();
    expect(deviceConnectionStartSchema.parse({ deviceName: null }).deviceName).toBeNull();
  });

  it("rejects an oversized or empty device name and unknown fields", () => {
    expect(deviceConnectionStartSchema.safeParse({ deviceName: "x".repeat(81) }).success).toBe(false);
    expect(deviceConnectionStartSchema.safeParse({ deviceName: "   " }).success).toBe(false);
    expect(deviceConnectionStartSchema.safeParse({ deviceName: "pc", extra: 1 }).success).toBe(false);
  });
});
