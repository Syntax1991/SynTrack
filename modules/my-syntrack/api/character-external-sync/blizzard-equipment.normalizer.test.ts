import { describe, expect, it } from "vitest";
import { normalizeBlizzardEquipment } from "./blizzard-equipment.normalizer.js";

describe("normalizeBlizzardEquipment", () => {
  it("computes average item level only from slots that report a level", () => {
    const result = normalizeBlizzardEquipment({
      equipped_items: [
        { slot: { type: "HEAD" }, level: { value: 300 } },
        { slot: { type: "CHEST" }, level: { value: 320 } },
        { slot: { type: "SHIRT" } } // no level - cosmetic slot
      ]
    });

    expect(result.averageItemLevel).toBe(310);
    expect(result.slots).toHaveLength(3);
  });

  it("preserves raw tier/embellishment evidence (bonus_list, set, item id) without classifying it", () => {
    const result = normalizeBlizzardEquipment({
      equipped_items: [
        {
          slot: { type: "HEAD" },
          item: { id: 271483 },
          bonus_list: [13334, 13692],
          set: { item_set: { id: 2065, name: "Prophecy of the Snake Oracle" } }
        }
      ]
    });

    expect(result.slots[0]).toMatchObject({
      slotKey: "HEAD",
      itemId: 271483,
      bonusList: [13334, 13692],
      setId: 2065,
      setName: "Prophecy of the Snake Oracle"
    });
  });

  it("marks a slot as enchanted only when the enchantments array is non-empty, and captures enchant ids", () => {
    const result = normalizeBlizzardEquipment({
      equipped_items: [
        {
          slot: { type: "WRIST" },
          enchantments: [{ enchantment_id: 7961 }]
        },
        { slot: { type: "LEGS" }, enchantments: [] },
        { slot: { type: "FEET" } }
      ]
    });

    const wrist = result.slots.find((slot) => slot.slotKey === "WRIST");
    const legs = result.slots.find((slot) => slot.slotKey === "LEGS");
    const feet = result.slots.find((slot) => slot.slotKey === "FEET");

    expect(wrist).toMatchObject({ hasEnchant: true, enchantIds: [7961] });
    expect(legs).toMatchObject({ hasEnchant: false, enchantIds: [] });
    expect(feet).toMatchObject({ hasEnchant: false, enchantIds: [] });
  });

  it("counts sockets and filled sockets independently of each other", () => {
    const result = normalizeBlizzardEquipment({
      equipped_items: [
        {
          slot: { type: "FINGER_1" },
          sockets: [{ item: { id: 213334 } }, {}]
        }
      ]
    });

    expect(result.slots[0]).toMatchObject({
      socketCount: 2,
      filledSocketCount: 1
    });
  });

  it("skips an equipped item with no slot type rather than fabricating one", () => {
    const result = normalizeBlizzardEquipment({
      equipped_items: [{ level: { value: 300 } }]
    });

    expect(result.slots).toHaveLength(0);
    // A slot-less item still shouldn't be silently dropped from the
    // average - but with no real slotKey to report, excluding it from
    // both the slot list and the average is the only safe choice here.
    expect(result.averageItemLevel).toBeNull();
  });

  it("returns nulls, not zeros or guesses, for a character with no equipped items", () => {
    const result = normalizeBlizzardEquipment({ equipped_items: [] });

    expect(result.averageItemLevel).toBeNull();
    expect(result.slots).toEqual([]);
  });
});
