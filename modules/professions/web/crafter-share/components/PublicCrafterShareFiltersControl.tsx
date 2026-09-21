import type { PublicCrafterShareFilters } from "../crafterShareFilter";

const QUALITY_OPTIONS: {
  value: PublicCrafterShareFilters["quality"];
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "RARE_OR_EPIC", label: "Rare & Epic" },
  { value: "EPIC", label: "Epic" },
  { value: "RARE", label: "Rare" }
];

export function PublicCrafterShareFiltersControl({
  filters,
  minItemLevelInput,
  onQueryChange,
  onQualityChange,
  onMinItemLevelInputChange
}: {
  filters: PublicCrafterShareFilters;
  minItemLevelInput: string;
  onQueryChange: (query: string) => void;
  onQualityChange: (quality: PublicCrafterShareFilters["quality"]) => void;
  onMinItemLevelInputChange: (value: string) => void;
}) {
  return (
    <div className="crafter-share-filters">
      <label className="crafter-share-search">
        <span>Find item</span>
        <input
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="e.g. bracers"
          type="search"
          value={filters.query}
        />
      </label>

      <div
        aria-label="Filter recipes by item quality"
        className="profession-find-craft-quality-filter"
        role="group"
      >
        {QUALITY_OPTIONS.map((option) => (
          <button
            className={filters.quality === option.value ? "active" : ""}
            key={option.value}
            onClick={() => onQualityChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="crafter-share-ilvl">
        <span>Min listed iLvl</span>
        <input
          inputMode="numeric"
          min={1}
          onChange={(event) => onMinItemLevelInputChange(event.target.value)}
          placeholder="e.g. 190"
          type="number"
          value={minItemLevelInput}
        />
      </label>

      <p>
        Armor, weapons, and jewelry only. Rare & Epic is the default —
        most crafted gear is stored as Rare, while bolts can be Epic
        without being gear. Item level is the listed Blizzard value;
        missing levels are not assumed to match a minimum.
      </p>
    </div>
  );
}
