import { describe, expect, it } from "vitest";
import { computeTooltipPlacement } from "./tooltipPlacement";

const viewport = { width: 1280, height: 800 };
const tooltipSize = { width: 200, height: 100 };

describe("computeTooltipPlacement", () => {
  it("places the tooltip above the anchor by default when there is room", () => {
    const anchor = {
      top: 400,
      left: 300,
      width: 40,
      height: 20
    };

    const result = computeTooltipPlacement(
      anchor,
      tooltipSize,
      viewport
    );

    expect(result.placement).toBe(
      "top"
    );

    expect(result.top).toBeLessThan(
      anchor.top
    );

    expect(result.left).toBe(
      anchor.left
    );
  });

  it("flips below the anchor when there isn't enough room above (the reported clipping bug)", () => {
    const anchor = {
      top: 20,
      left: 300,
      width: 40,
      height: 20
    };

    const result = computeTooltipPlacement(
      anchor,
      tooltipSize,
      viewport
    );

    expect(result.placement).toBe(
      "bottom"
    );

    expect(
      result.top
    ).toBeGreaterThan(
      anchor.top + anchor.height
    );
  });

  it("never places any part of the tooltip above the viewport margin, even when neither side fully fits", () => {
    const anchor = {
      top: 30,
      left: 300,
      width: 40,
      height: 780
    };

    const result = computeTooltipPlacement(
      anchor,
      { width: 200, height: 400 },
      viewport
    );

    expect(
      result.top
    ).toBeGreaterThanOrEqual(8);

    expect(
      result.top + 400
    ).toBeLessThanOrEqual(
      viewport.height
    );
  });

  it("shifts left (right-aligns to the anchor) when the default left-aligned position would overflow the right edge", () => {
    const anchor = {
      top: 400,
      left: 1200,
      width: 40,
      height: 20
    };

    const result = computeTooltipPlacement(
      anchor,
      tooltipSize,
      viewport
    );

    expect(
      result.left + tooltipSize.width
    ).toBeLessThanOrEqual(
      viewport.width - 8
    );

    expect(
      result.left
    ).toBeLessThan(anchor.left);
  });

  it("clamps to the left viewport margin when the anchor is near the left edge", () => {
    const anchor = {
      top: 400,
      left: -50,
      width: 40,
      height: 20
    };

    const result = computeTooltipPlacement(
      anchor,
      tooltipSize,
      viewport
    );

    expect(
      result.left
    ).toBeGreaterThanOrEqual(8);
  });

  it("keeps the full tooltip within the viewport horizontally for a wide (but fittable) tooltip", () => {
    const anchor = {
      top: 400,
      left: 640,
      width: 40,
      height: 20
    };

    const wideTooltip = {
      width: 1000,
      height: 100
    };

    const result = computeTooltipPlacement(
      anchor,
      wideTooltip,
      viewport
    );

    expect(
      result.left
    ).toBeGreaterThanOrEqual(8);

    expect(
      result.left +
        wideTooltip.width
    ).toBeLessThanOrEqual(
      viewport.width - 8
    );
  });
});
