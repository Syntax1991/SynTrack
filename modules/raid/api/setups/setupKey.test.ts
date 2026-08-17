import { describe, expect, it } from "vitest";
import { generateSetupKey } from "./setupKey.js";

describe("generateSetupKey", () => {
  it("derives a readable slug prefix from the name", () => {
    expect(
      generateSetupKey("Thursday Mythic")
    ).toMatch(/^thursday-mythic-[0-9a-f]{8}$/);
  });

  it("strips characters that aren't letters/digits", () => {
    expect(
      generateSetupKey("Split #1 (EU)")
    ).toMatch(/^split-1-eu-[0-9a-f]{8}$/);
  });

  it("falls back to a generic slug for an all-punctuation name", () => {
    expect(
      generateSetupKey("!!!")
    ).toMatch(/^setup-[0-9a-f]{8}$/);
  });

  it("never produces the same key twice for the same name — the random suffix is what guarantees uniqueness, not the name", () => {
    const first = generateSetupKey(
      "Split 1"
    );

    const second = generateSetupKey(
      "Split 1"
    );

    expect(first).not.toBe(second);
  });
});
