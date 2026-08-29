import type {
  GearCharacter,
  GearSlot,
  GearSlotFilter,
  GearSlotKey
} from "../types/gearReadiness.types";

type GearSlotGridProps = {
  character: GearCharacter;
  filter: GearSlotFilter;
  selectedSlotKey: GearSlotKey | null;
  onFilterChange: (
    filter: GearSlotFilter
  ) => void;
  onSelectSlot: (slotKey: GearSlotKey) => void;
};

const categoryLabels = {
  ARMOR: "Armor",
  ACCESSORIES: "Accessories",
  WEAPONS: "Weapons"
};

const categoryOrder = [
  "ARMOR",
  "ACCESSORIES",
  "WEAPONS"
] as const;

function isVisible(
  slot: GearSlot,
  filter: GearSlotFilter
) {
  if (filter === "issues") {
    return slot.issues.issueCount > 0;
  }

  if (filter === "tracked") {
    return slot.item !== null;
  }

  return true;
}

function getEnchantLabel(slot: GearSlot) {
  if (!slot.item) {
    return null;
  }

  if (!slot.supportsEnchant) {
    return "No enchant";
  }

  return slot.item.enchantStatus === "READY"
    ? "Enchanted"
    : "Enchant missing";
}

export function GearSlotGrid({
  character,
  filter,
  selectedSlotKey,
  onFilterChange,
  onSelectSlot
}: GearSlotGridProps) {
  const visibleSlots = character.slots.filter(
    (slot) => isVisible(slot, filter)
  );

  return (
    <section className="panel gear-slot-panel">
      <div className="panel-header gear-slot-header">
        <div>
          <p className="eyebrow">
            EQUIPMENT LOADOUT
          </p>

          <h2>{character.name}</h2>

          <p>
            {character.trackedSlotCount}/16 slots
            {" - "}
            {character.issueCount} issues
          </p>
        </div>

        <div
          aria-label="Gear filter"
          className="gear-slot-filters"
          role="group"
        >
          {(["all", "issues", "tracked"] as const)
            .map((filterOption) => (
              <button
                aria-pressed={
                  filter === filterOption
                }
                className={
                  filter === filterOption
                    ? "is-active"
                    : ""
                }
                key={filterOption}
                onClick={() =>
                  onFilterChange(filterOption)
                }
                type="button"
              >
                {filterOption}
              </button>
            ))}
        </div>
      </div>

      {visibleSlots.length === 0 ? (
        <div className="gear-slot-empty">
          <span>OK</span>
          <strong>No gear issues found</strong>
          <p>
            Change the filter to view tracked or
            empty equipment slots.
          </p>
        </div>
      ) : (
        <div className="gear-slot-groups">
          {categoryOrder.map((category) => {
            const slots = visibleSlots.filter(
              (slot) =>
                slot.category === category
            );

            if (slots.length === 0) {
              return null;
            }

            return (
              <section
                className="gear-slot-group"
                key={category}
              >
                <div className="gear-slot-group-heading">
                  <span>
                    {categoryLabels[category]}
                  </span>
                  <small>{slots.length} slots</small>
                </div>

                <div className="gear-slot-grid">
                  {slots.map((slot) => {
                    const enchantLabel =
                      getEnchantLabel(slot);

                    return (
                      <button
                        aria-pressed={
                          selectedSlotKey ===
                          slot.key
                        }
                        className={[
                          "gear-slot-card",
                          slot.item
                            ? "is-tracked"
                            : "is-empty",
                          slot.issues.issueCount > 0
                            ? "has-issues"
                            : "",
                          selectedSlotKey === slot.key
                            ? "is-selected"
                            : ""
                        ].filter(Boolean).join(" ")}
                        key={slot.key}
                        onClick={() =>
                          onSelectSlot(slot.key)
                        }
                        type="button"
                      >
                        <span className="gear-slot-code">
                          {slot.label
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>

                        <span className="gear-slot-copy">
                          <small>{slot.label}</small>
                          <strong>
                            {slot.item
                              ? (slot.item.itemName ??
                                "Unknown item")
                              : "Not tracked"}
                          </strong>

                          <span className="gear-slot-badges">
                            {slot.item?.itemLevel && (
                              <span>
                                iLvl {slot.item.itemLevel}
                              </span>
                            )}

                            {enchantLabel && (
                              <span>
                                {enchantLabel}
                              </span>
                            )}

                            {slot.item &&
                              (slot.item.socketCount ?? 0) > 0 && (
                                <span
                                  className={
                                    slot.issues
                                      .missingGemCount > 0
                                      ? "is-warning"
                                      : ""
                                  }
                                >
                                  Gems {slot.item.gemCount}/
                                  {slot.item.socketCount}
                                </span>
                              )}
                          </span>
                        </span>

                        <span className="gear-slot-action">
                          {slot.item ? "Edit" : "Add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
