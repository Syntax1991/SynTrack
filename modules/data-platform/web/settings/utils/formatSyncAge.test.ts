import { describe, expect, it } from "vitest";
import { formatSyncAge } from "./formatSyncAge";

describe("formatSyncAge", () => {
  it("returns Never for empty timestamps", () => {
    expect(formatSyncAge(null)).toEqual({
      label: "Never",
      title: null
    });
  });

  it("returns Just now for very recent syncs", () => {
    const recent = new Date(
      Date.now() - 30_000
    ).toISOString();

    expect(formatSyncAge(recent).label).toBe(
      "Just now"
    );
  });

  it("returns minute-based labels for recent syncs", () => {
    const fourMinutesAgo = new Date(
      Date.now() - 4 * 60_000
    ).toISOString();

    expect(
      formatSyncAge(fourMinutesAgo).label
    ).toBe("4 min ago");
  });
});
