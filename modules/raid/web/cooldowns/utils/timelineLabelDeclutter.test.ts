import { describe, expect, it } from "vitest";
import { computeCastLabelVisibility } from "./timelineLabelDeclutter.js";

describe("computeCastLabelVisibility", () => {
  it("shows every label when casts are far apart in real pixels", () => {
    // 420s duration, 840px track => 2px/sec. 100s apart = 200px apart.
    expect(
      computeCastLabelVisibility(
        [0, 100, 200],
        840,
        420
      )
    ).toEqual([true, true, true]);
  });

  it("suppresses a label whose pixel gap from the last SHOWN label is too small", () => {
    // 420s duration, 420px track => 1px/sec. 10s apart = 10px apart —
    // well under the default 32px minimum gap.
    expect(
      computeCastLabelVisibility(
        [0, 10, 20],
        420,
        420
      )
    ).toEqual([true, false, false]);
  });

  it("resumes showing once the gap from the last SHOWN label is large enough again", () => {
    // 1px/sec. 0 shown, 10 suppressed (10px < 32), 50 shown (50px from 0 >= 32).
    expect(
      computeCastLabelVisibility(
        [0, 10, 50],
        420,
        420
      )
    ).toEqual([true, false, true]);
  });

  it("scales with actual measured track width, not a fixed seconds threshold", () => {
    const timestamps = [0, 10, 20];

    // Narrow track: 1px/sec — 10s gaps (10px) collide against the 32px minimum.
    expect(
      computeCastLabelVisibility(
        timestamps,
        420,
        420
      )
    ).toEqual([true, false, false]);

    // Wide track: 4px/sec — the same 10s gaps (40px) now clear the minimum.
    expect(
      computeCastLabelVisibility(
        timestamps,
        1680,
        420
      )
    ).toEqual([true, true, true]);
  });

  it("hides all labels when the track hasn't been measured yet (width <= 0)", () => {
    expect(
      computeCastLabelVisibility(
        [0, 100, 200],
        0,
        420
      )
    ).toEqual([false, false, false]);
  });

  it("returns an empty array for no casts", () => {
    expect(
      computeCastLabelVisibility([], 840, 420)
    ).toEqual([]);
  });
});
