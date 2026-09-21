/*
 * Player-worn/wielded slots from addon-import.recipe-output-capability
 * outputSlots. Profession tools/accessories are deliberately omitted:
 * the public card is raid-gear, not crafting-station gear.
 */
const PLAYER_GEAR_SLOT_KEYS = new Set([
  "HEAD",
  "NECK",
  "SHOULDER",
  "BACK",
  "CHEST",
  "WRIST",
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER",
  "TRINKET",
  "ONE_HAND",
  "MAIN_HAND",
  "OFF_HAND",
  "TWO_HAND",
  "RANGED"
]);

export type CrafterShareGearCapability = {
  type: string;
  name: string;
  slotKey: string | null;
};

function isPlayerGearSlot(
  capability: CrafterShareGearCapability
): boolean {
  return (
    capability.type === "EQUIPMENT_SLOT" &&
    capability.slotKey !== null &&
    PLAYER_GEAR_SLOT_KEYS.has(capability.slotKey)
  );
}

export function isPublicCrafterSharePlayerGear(
  capabilities: CrafterShareGearCapability[]
): boolean {
  return capabilities.some(isPlayerGearSlot);
}

export function getPublicCrafterShareGearSlotName(
  capabilities: CrafterShareGearCapability[]
): string | null {
  return capabilities.find(isPlayerGearSlot)?.name ?? null;
}
