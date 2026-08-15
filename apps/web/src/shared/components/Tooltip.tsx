import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: ReactNode;
  disabled?: boolean;
  children: ReactNode;
  /**
   * Extra class/style applied to the anchor `<span>` itself, not a
   * wrapper around it — needed when the child relies on being
   * positioned (e.g. `position: absolute; left: X%`) relative to a
   * specific ancestor. Passing that positioning here keeps the
   * marker's own layout unchanged instead of nesting it one level
   * deeper inside a fresh positioning context.
   */
  anchorClassName?: string;
  anchorStyle?: CSSProperties;
};

/**
 * Compact hover popover, not a native `title` tooltip. `disabled`
 * forces it hidden regardless of hover state — used to suppress it
 * while a timeline marker is being dragged, so it never fights the
 * drag for pointer attention.
 *
 * The popover content is rendered through a portal into
 * `document.body`, positioned via the anchor's real
 * `getBoundingClientRect()` rather than as a CSS-positioned child of
 * the anchor. Several real timeline markers set `overflow: hidden`
 * on their own anchor box (to clip a square icon into a rounded
 * shape) — a popover nested inside that box gets silently clipped no
 * matter how it's positioned, even though the DOM node still exists
 * and has real text content. A portal sidesteps every ancestor's
 * overflow/stacking context entirely, which local CSS fixes can't.
 */
export function Tooltip({
  content,
  disabled,
  children,
  anchorClassName,
  anchorStyle
}: TooltipProps) {
  const anchorRef =
    useRef<HTMLSpanElement>(null);

  const [isHovered, setIsHovered] =
    useState(false);

  const [
    anchorPosition,
    setAnchorPosition
  ] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const isVisible =
    isHovered && !disabled;

  useLayoutEffect(() => {
    if (
      !isVisible ||
      !anchorRef.current
    ) {
      return;
    }

    const rect =
      anchorRef.current.getBoundingClientRect();

    setAnchorPosition({
      top: rect.top,
      left:
        rect.left + rect.width / 2
    });
  }, [isVisible]);

  const className = anchorClassName
    ? `tooltip-anchor ${anchorClassName}`
    : "tooltip-anchor";

  return (
    <span
      className={className}
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() =>
        setIsHovered(false)
      }
      ref={anchorRef}
      style={anchorStyle}
    >
      {children}

      {isVisible &&
        anchorPosition &&
        createPortal(
          <span
            className="tooltip-popover"
            role="tooltip"
            style={
              {
                top: anchorPosition.top,
                left: anchorPosition.left
              } as CSSProperties
            }
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
