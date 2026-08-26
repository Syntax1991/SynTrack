export type TooltipRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type TooltipSize = {
  width: number;
  height: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export type TooltipPlacementResult = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 6;

/*
 * Pure placement math for the portal-rendered tooltip - no DOM access,
 * so it's fully unit-testable. Takes the anchor's and tooltip's already-
 * measured rects (getBoundingClientRect-shaped) plus the viewport size,
 * and returns fixed-position top/left that keeps the tooltip fully
 * inside the viewport.
 *
 * Default: above the anchor, left-aligned to it (matching the previous
 * CSS-only behavior). Flips below when there isn't enough room above;
 * when neither direction fully fits, picks whichever side has more
 * room and clamps within the viewport margin rather than clipping.
 * Horizontally: shifts left (right-aligning to the anchor) when the
 * tooltip would overflow the right edge, then clamps to the viewport
 * margin as a last resort on either side.
 */
export function computeTooltipPlacement(
  anchorRect: TooltipRect,
  tooltipSize: TooltipSize,
  viewport: ViewportSize
): TooltipPlacementResult {
  const spaceAbove = anchorRect.top;

  const spaceBelow =
    viewport.height -
    (anchorRect.top + anchorRect.height);

  const requiredSpace =
    tooltipSize.height +
    ANCHOR_GAP +
    VIEWPORT_MARGIN;

  const fitsAbove =
    spaceAbove >= requiredSpace;

  const fitsBelow =
    spaceBelow >= requiredSpace;

  const placement: "top" | "bottom" =
    fitsAbove ||
    (
      !fitsBelow &&
      spaceAbove >= spaceBelow
    )
      ? "top"
      : "bottom";

  let top =
    placement === "top"
      ? anchorRect.top -
        tooltipSize.height -
        ANCHOR_GAP
      : anchorRect.top +
        anchorRect.height +
        ANCHOR_GAP;

  top = clamp(
    top,
    VIEWPORT_MARGIN,
    viewport.height -
      tooltipSize.height -
      VIEWPORT_MARGIN
  );

  let left = anchorRect.left;

  if (
    left + tooltipSize.width >
    viewport.width - VIEWPORT_MARGIN
  ) {
    left =
      anchorRect.left +
      anchorRect.width -
      tooltipSize.width;
  }

  left = clamp(
    left,
    VIEWPORT_MARGIN,
    viewport.width -
      tooltipSize.width -
      VIEWPORT_MARGIN
  );

  return {
    top,
    left,
    placement
  };
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  if (max < min) {
    return min;
  }

  return Math.min(
    Math.max(value, min),
    max
  );
}
