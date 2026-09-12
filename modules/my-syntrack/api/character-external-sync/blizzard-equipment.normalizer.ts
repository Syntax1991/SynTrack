import type { BattleNetCharacterEquipment } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { NormalizedBlizzardEquipmentPayload } from "./character-external-sync.types.js";

export function normalizeBlizzardEquipment(
  equipment: BattleNetCharacterEquipment
): NormalizedBlizzardEquipmentPayload {
  const items = equipment.equipped_items ?? [];

  let itemLevelSum = 0;
  let itemLevelCount = 0;

  const slots = items.flatMap((item) => {
    const slotKey = item.slot?.type;

    if (!slotKey) {
      return [];
    }

    const level = item.level?.value ?? null;
    const timewalkerLevel = item.timewalker_level ?? null;

    /*
     * A scaled-bracket item (Timewalking, etc.) is excluded from the
     * average - its `level.value` reflects the bracket, not the item's
     * real item level, so summing it in would silently drag the whole
     * character's average down (see the Phase F1 corrective review's
     * Synbeast finding: an entire equipped set scaled to a Timewalking
     * dungeon, averaging ~278 instead of anywhere near the real gear).
     */
    if (typeof level === "number" && timewalkerLevel === null) {
      itemLevelSum += level;
      itemLevelCount += 1;
    }

    let socketCount = 0;
    let filledSocketCount = 0;

    for (const socket of item.sockets ?? []) {
      socketCount += 1;

      if (socket.item) {
        filledSocketCount += 1;
      }
    }

    const enchantments = item.enchantments ?? [];

    return [
      {
        slotKey,
        itemId: item.item?.id ?? null,
        itemName: item.name ?? null,
        itemLevel: level,
        quality: item.quality?.type ?? null,
        hasEnchant: enchantments.length > 0,
        enchantIds: enchantments.flatMap((enchantment) =>
          typeof enchantment.enchantment_id === "number"
            ? [enchantment.enchantment_id]
            : []
        ),
        socketCount,
        filledSocketCount,
        bonusList: item.bonus_list ?? [],
        setId: item.set?.item_set?.id ?? null,
        setName: item.set?.item_set?.name ?? null,
        upgradeCurrent: item.upgrades?.value ?? null,
        upgradeMax: item.upgrades?.max_value ?? null,
        // See BattleNetEquippedItem.timewalker_level - presence means
        // `level` above is a scaled-bracket value, not the item's real one.
        timewalkerLevel
      }
    ];
  });

  return {
    averageItemLevel:
      itemLevelCount > 0 ? itemLevelSum / itemLevelCount : null,
    slots
  };
}
