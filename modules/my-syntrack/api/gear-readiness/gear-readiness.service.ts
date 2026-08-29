import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import {
  findGearSlotDefinition,
  gearSlotCatalog
} from "./gear-readiness.catalog.js";
import { GearReadinessRepository } from "./gear-readiness.repository.js";
import type {
  GearSlotInput,
  GearSlotKey
} from "./gear-readiness.types.js";

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(
    (
      values.reduce(
        (total, value) => total + value,
        0
      ) /
      values.length
    ) * 10
  ) / 10;
}

function normalizeInput(
  slotKey: GearSlotKey,
  input: GearSlotInput
): GearSlotInput {
  const definition =
    findGearSlotDefinition(slotKey);

  if (!definition?.supportsEnchant) {
    return {
      ...input,
      enchantStatus: "NOT_APPLICABLE",
      enchantName: undefined
    };
  }

  return input;
}

export class GearReadinessService {
  constructor(
    private readonly repository:
      GearReadinessRepository
  ) {}

  async getOverview() {
    const characters =
      await this.repository.findCharacters();

    const characterItems = characters.map(
      (character) => {
        const storedSlots = new Map(
          character.gearSlots.map(
            (slot) => [slot.slotKey, slot]
          )
        );
        const slots = gearSlotCatalog.map(
          (definition) => {
            const item =
              storedSlots.get(definition.key);
            const missingEnchant = Boolean(
              item &&
              definition.supportsEnchant &&
              item.enchantStatus !== "READY"
            );
            /*
             * An addon-captured slot can have socketCount = null when
             * the socket-count API wasn't ready at capture time -
             * UNKNOWN socket count is deliberately excluded from the
             * missing-gem tally rather than treated as zero, since
             * either a real 0 or a real "missing gems" answer would be
             * a guess in that case.
             */
            const missingGemCount =
              item && item.socketCount !== null
                ? Math.max(
                    item.socketCount -
                      item.gemCount,
                    0
                  )
                : 0;

            return {
              ...definition,
              item: item
                ? {
                    id: item.id,
                    itemName: item.itemName,
                    itemLevel: item.itemLevel,
                    enchantStatus:
                      item.enchantStatus,
                    enchantName:
                      item.enchantName,
                    socketCount:
                      item.socketCount,
                    gemCount: item.gemCount,
                    notes: item.notes,
                    source: item.source,
                    lastSyncedAt:
                      item.lastSyncedAt
                        ?.toISOString() ?? null,
                    updatedAt:
                      item.updatedAt.toISOString()
                  }
                : null,
              issues: {
                /*
                 * Enchant presence is still recorded for detail views,
                 * but missing enchants are NOT SynTrack readiness/
                 * attention criteria (user checks them in-game).
                 */
                missingEnchant,
                missingGemCount,
                issueCount: missingGemCount
              }
            };
          }
        );
        const trackedSlots = slots.filter(
          (slot) => slot.item !== null
        );
        const issueCount = slots.reduce(
          (total, slot) =>
            total + slot.issues.issueCount,
          0
        );
        const socketCount =
          trackedSlots.reduce(
            (total, slot) =>
              total +
              (slot.item?.socketCount ?? 0),
            0
          );
        const gemCount =
          trackedSlots.reduce(
            (total, slot) =>
              total + Math.min(
                slot.item?.gemCount ?? 0,
                slot.item?.socketCount ?? 0
              ),
            0
          );
        /*
         * Readiness is socket/gem coverage only - enchant completion
         * is intentionally excluded from the percentage.
         */
        const readinessPercent =
          trackedSlots.length === 0
            ? 0
            : socketCount === 0
              ? 100
              : Math.round(
                  (gemCount / socketCount) * 100
                );

        return {
          id: character.id,
          name: character.name,
          realm: character.realm,
          region: character.region,
          className: character.className,
          level: character.level,
          slots,
          trackedSlotCount:
            trackedSlots.length,
          averageItemLevel: average(
            trackedSlots.flatMap((slot) =>
              slot.item?.itemLevel
                ? [slot.item.itemLevel]
                : []
            )
          ),
          issueCount,
          readinessPercent
        };
      }
    );
    const allSlots = characterItems.flatMap(
      (character) => character.slots
    );
    const trackedSlots = allSlots.filter(
      (slot) => slot.item !== null
    );

    return {
      characters: characterItems,
      summary: {
        trackedItemCount: trackedSlots.length,
        averageItemLevel: average(
          trackedSlots.flatMap((slot) =>
            slot.item?.itemLevel
              ? [slot.item.itemLevel]
              : []
          )
        ),
        missingEnchantCount:
          allSlots.filter(
            (slot) =>
              slot.issues.missingEnchant
          ).length,
        emptySocketCount:
          allSlots.reduce(
            (total, slot) =>
              total +
              slot.issues.missingGemCount,
            0
          ),
        readyCharacterCount:
          characterItems.filter(
            (character) =>
              character.trackedSlotCount > 0 &&
              character.issueCount === 0
          ).length
      }
    };
  }

  async updateSlot(
    characterId: string,
    slotKey: GearSlotKey,
    input: GearSlotInput
  ) {
    await this.requireCharacter(characterId);

    if (input.gemCount > input.socketCount) {
      throw new AppError(
        400,
        "Gem count cannot exceed socket count."
      );
    }

    await this.repository.upsertSlot(
      characterId,
      slotKey,
      normalizeInput(slotKey, input)
    );

    return this.getOverview();
  }

  async clearSlot(
    characterId: string,
    slotKey: GearSlotKey
  ) {
    await this.requireCharacter(characterId);
    await this.repository.deleteSlot(
      characterId,
      slotKey
    );

    return this.getOverview();
  }

  private async requireCharacter(
    characterId: string
  ) {
    const character =
      await this.repository
        .findCharacterById(characterId);

    if (!character) {
      throw new AppError(
        404,
        "Character not found."
      );
    }

    return character;
  }
}
