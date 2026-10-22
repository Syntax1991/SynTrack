import type { JournalLootItem } from "../types/bonusRoll.types";

type LootItemSelectProps = {
  label: string;
  items: JournalLootItem[];
  value: number | null;
  onChange: (itemId: number | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
  /* Label of the empty option; omit to force a choice. */
  emptyLabel?: string;
};

export function lootItemLabel(item: JournalLootItem): string {
  return item.slot ? `${item.name} · ${item.slot}` : item.name;
}

/* Boss loot dropdown, fed by the Blizzard Encounter Journal. */
export function LootItemSelect({
  label,
  items,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  emptyLabel
}: LootItemSelectProps) {
  return (
    <label className="bonus-roll-field">
      <span>{label}</span>
      <select
        aria-label={label}
        disabled={disabled || isLoading}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        value={value ?? ""}
      >
        {isLoading ? (
          <option value="">Loading loot…</option>
        ) : (
          <>
            {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
            {emptyLabel === undefined && value === null && (
              <option disabled value="">
                Choose an item
              </option>
            )}
            {items.map((item) => (
              <option
                className={item.quality ? `bonus-roll-quality-${item.quality.toLowerCase()}` : undefined}
                key={item.id}
                value={item.id}
              >
                {lootItemLabel(item)}
              </option>
            ))}
          </>
        )}
      </select>
    </label>
  );
}
