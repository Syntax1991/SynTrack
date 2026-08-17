import {
  useLayoutEffect,
  useState,
  type RefObject
} from "react";

/**
 * Live-measured rendered width of a DOM node — the real geometry
 * driving pixel-based layout decisions (e.g. timestamp label
 * decluttering) that must stay correct across window/panel resizes,
 * not just at first paint.
 *
 * Deliberately does NOT rely on ResizeObserver alone for the initial
 * measurement: some environments never fire a ResizeObserver's first
 * callback for an element sized purely via absolute-positioning
 * inset properties (confirmed live in this app's own sandboxed test
 * environment — a real, reproducible failure, not a one-off), which
 * would silently leave every consumer stuck at 0 forever. A
 * synchronous `getBoundingClientRect()` read in `useLayoutEffect`
 * (before paint) gives a correct value unconditionally; ResizeObserver
 * is then layered on top purely to keep that value live across actual
 * resizes where it does fire.
 */
export function useMeasuredWidth(
  ref: RefObject<HTMLElement | null>
): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    setWidth(
      element.getBoundingClientRect()
        .width
    );

    const observer = new ResizeObserver(
      (entries) => {
        const measured =
          entries[0]?.contentRect.width;

        if (measured !== undefined) {
          setWidth(measured);
        }
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}
