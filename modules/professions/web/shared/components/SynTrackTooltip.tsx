import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { computeTooltipPlacement } from "./tooltipPlacement";

type SynTrackTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

const HIDDEN_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden"
};

/*
 * A self-contained hover/focus tooltip built entirely from SynTrack's
 * own stored data - no Wowhead script, no external request, no
 * third-party dependency for core UI, no network call on open (content
 * is passed in already-rendered). Content is progressive disclosure (a
 * few lines), never a second detail page.
 *
 * The tooltip content is rendered through a React portal into
 * document.body and positioned with `position: fixed` computed from
 * the anchor's real getBoundingClientRect(). This is a deliberate fix
 * for a real bug: the previous version positioned the tooltip with
 * plain CSS (`position: absolute` relative to the anchor), which meant
 * any anchor inside a scrolling ancestor (e.g. the Find Craft recipe
 * list's `overflow-y: auto` container) had its tooltip clipped by that
 * container's overflow box whenever the tooltip would extend outside
 * it - visibly, for rows near the top of the list, since the tooltip
 * opens upward by default. A portalled, fixed-position, JS-measured
 * tooltip is not a child of that scrolling container at all, so it can
 * never be clipped by it, and computeTooltipPlacement() (a pure,
 * separately-tested function) flips/shifts it to stay fully inside the
 * viewport instead of relying on the anchor always having room above.
 */
export function SynTrackTooltip({
  content,
  children,
  className
}: SynTrackTooltipProps) {
  const anchorRef =
    useRef<HTMLSpanElement>(null);

  const tooltipRef =
    useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [style, setStyle] =
    useState<CSSProperties>(
      HIDDEN_STYLE
    );

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      const anchorEl =
        anchorRef.current;

      const tooltipEl =
        tooltipRef.current;

      if (!anchorEl || !tooltipEl) {
        return;
      }

      const anchorRect =
        anchorEl.getBoundingClientRect();

      const tooltipRect =
        tooltipEl.getBoundingClientRect();

      const placement =
        computeTooltipPlacement(
          anchorRect,
          {
            width:
              tooltipRect.width,
            height:
              tooltipRect.height
          },
          {
            width:
              window.innerWidth,
            height:
              window.innerHeight
          }
        );

      setStyle({
        position: "fixed",
        top: placement.top,
        left: placement.left,
        visibility: "visible"
      });
    }

    updatePosition();

    window.addEventListener(
      "scroll",
      updatePosition,
      true
    );

    window.addEventListener(
      "resize",
      updatePosition
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updatePosition,
        true
      );

      window.removeEventListener(
        "resize",
        updatePosition
      );
    };
  }, [isOpen, content]);

  function open() {
    setStyle(HIDDEN_STYLE);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <span
      className={
        className
          ? `syntrack-tooltip-anchor ${className}`
          : "syntrack-tooltip-anchor"
      }
      onBlur={close}
      onFocus={open}
      onKeyDown={
        (event) => {
          if (event.key === "Escape") {
            close();
          }
        }
      }
      onMouseEnter={open}
      onMouseLeave={close}
      ref={anchorRef}
    >
      {children}

      {isOpen &&
        createPortal(
          <div
            className="syntrack-tooltip-content syntrack-tooltip-portal"
            ref={tooltipRef}
            role="tooltip"
            style={style}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}
