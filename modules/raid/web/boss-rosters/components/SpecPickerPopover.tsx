import { useEffect, useRef } from "react";
import { getSpecsForClass } from "../../../shared/catalog/raidSpecializationCatalog";

type SpecPickerPopoverProps = {
  className: string;
  currentSpecId: number | null;
  onSelect: (specId: number | null) => void;
  onClose: () => void;
};

/**
 * The one place a Setup+Boss composition entry's specialization is
 * actually mutated — deliberately compact (icon + name per option, no
 * multi-step form) and scoped to exactly the member's real class
 * specs, per the "keep it compact, avoid giant forms" rule for this
 * matrix. Closes on any outside click so it never lingers over the
 * next cell the officer clicks.
 */
export function SpecPickerPopover({
  className,
  currentSpecId,
  onSelect,
  onClose
}: SpecPickerPopoverProps) {
  const popoverRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (
      event: PointerEvent
    ) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(
          event.target as Node
        )
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
  }, [onClose]);

  const specs = getSpecsForClass(className);

  return (
    <div
      className="spec-picker-popover"
      onClick={(event) =>
        event.stopPropagation()
      }
      ref={popoverRef}
    >
      <button
        className={
          currentSpecId === null
            ? "spec-picker-option is-active"
            : "spec-picker-option"
        }
        onClick={() => {
          onSelect(null);
          onClose();
        }}
        type="button"
      >
        Unknown
      </button>

      {specs.map((spec) => (
        <button
          className={
            currentSpecId === spec.specId
              ? "spec-picker-option is-active"
              : "spec-picker-option"
          }
          key={spec.specId}
          onClick={() => {
            onSelect(spec.specId);
            onClose();
          }}
          type="button"
        >
          <img
            alt=""
            className="spec-picker-option-icon"
            src={spec.icon}
          />
          {spec.name}
        </button>
      ))}
    </div>
  );
}
