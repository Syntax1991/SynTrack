import type {
  QualityFilterOption
} from "../utils/professionItemQuality.helpers";

const OPTIONS: {
  value: QualityFilterOption;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "EPIC", label: "Epic" },
  { value: "RARE", label: "Rare" }
];

export function ProfessionItemQualityFilterControl({
  value,
  onChange
}: {
  value: QualityFilterOption;
  onChange: (
    value: QualityFilterOption
  ) => void;
}) {
  return (
    <div
      className="profession-find-craft-quality-filter"
      role="group"
      aria-label="Filter recipes by item quality"
    >
      {OPTIONS.map(
        (option) => (
          <button
            className={
              value === option.value
                ? "active"
                : ""
            }
            key={option.value}
            onClick={
              () =>
                onChange(
                  option.value
                )
            }
            type="button"
          >
            {option.label}
          </button>
        )
      )}
    </div>
  );
}
