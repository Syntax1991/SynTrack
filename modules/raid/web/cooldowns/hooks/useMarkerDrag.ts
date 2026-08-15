import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject
} from "react";
import { secondsFromClickX } from "../utils/timelineFormat";

const dragThresholdPx = 4;

function computeSeconds(
  clientX: number,
  trackRef: RefObject<HTMLDivElement | null>,
  fightDurationSeconds: number
): number {
  if (!trackRef.current) {
    return 0;
  }

  return secondsFromClickX(
    clientX,
    trackRef.current,
    fightDurationSeconds
  );
}

// A native `click` always follows `mouseup`, bubbling from the marker
// to the track underneath — after a drag (marker moved out from under
// the cursor) or after a plain click-to-remove (marker still there,
// but should not also start a new assignment at that spot), that
// bubbled click would otherwise open the track's click-to-place flow.
// Swallow that one synthesized click in the capture phase, before
// React sees it, for both cases.
function suppressNextClick(): void {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    document.removeEventListener(
      "click",
      swallow,
      true
    );
  };

  document.addEventListener(
    "click",
    swallow,
    true
  );
}

export function useMarkerDrag(params: {
  trackRef: RefObject<HTMLDivElement | null>;
  fightDurationSeconds: number;
  onDrop: (seconds: number) => void;
  onClick: () => void;
  onDragPreview?: (
    seconds: number | null
  ) => void;
}) {
  const {
    trackRef,
    fightDurationSeconds,
    onDrop,
    onClick,
    onDragPreview
  } = params;

  const [isDragging, setIsDragging] =
    useState(false);

  const [previewSeconds, setPreviewSeconds] =
    useState<number | null>(null);

  const startXRef = useRef(0);
  const draggedRef = useRef(false);

  const onMouseDown = useCallback(
    (
      event: ReactMouseEvent<HTMLButtonElement>
    ) => {
      event.stopPropagation();
      event.preventDefault();

      startXRef.current = event.clientX;
      draggedRef.current = false;

      const handleMouseMove = (
        moveEvent: MouseEvent
      ) => {
        if (
          !draggedRef.current &&
          Math.abs(
            moveEvent.clientX -
              startXRef.current
          ) > dragThresholdPx
        ) {
          draggedRef.current = true;
          setIsDragging(true);
        }

        if (draggedRef.current) {
          const seconds =
            computeSeconds(
              moveEvent.clientX,
              trackRef,
              fightDurationSeconds
            );

          setPreviewSeconds(seconds);
          onDragPreview?.(seconds);
        }
      };

      const handleMouseUp = (
        upEvent: MouseEvent
      ) => {
        document.removeEventListener(
          "mousemove",
          handleMouseMove
        );
        document.removeEventListener(
          "mouseup",
          handleMouseUp
        );

        suppressNextClick();

        if (draggedRef.current) {
          onDrop(
            computeSeconds(
              upEvent.clientX,
              trackRef,
              fightDurationSeconds
            )
          );
        }
        else {
          onClick();
        }

        setIsDragging(false);
        setPreviewSeconds(null);
        onDragPreview?.(null);
      };

      document.addEventListener(
        "mousemove",
        handleMouseMove
      );
      document.addEventListener(
        "mouseup",
        handleMouseUp
      );
    },
    [
      trackRef,
      fightDurationSeconds,
      onDrop,
      onClick,
      onDragPreview
    ]
  );

  return {
    onMouseDown,
    isDragging,
    previewSeconds
  };
}
