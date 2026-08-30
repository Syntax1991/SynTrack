import type {
  GearSlotInput,
  GearSlotKey
} from "./gear-readiness.types.js";
import { findGearSlotDefinition } from "./gear-readiness.catalog.js";

export function parseSpellIds(
  value: string | null | undefined
): number[] | null {
  if (value == null || value === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.filter(
      (entry): entry is number =>
        typeof entry === "number" && Number.isFinite(entry)
    );
  } catch {
    return null;
  }
}

export function resolveCurrentExpansionId(
  slots: {
    item: {
      expansionId: number | null;
      setEvidenceResolved: boolean | null;
    } | null;
  }[]
): number | null {
  let max: number | null = null;

  for (const slot of slots) {
    const item = slot.item;

    if (
      !item ||
      item.setEvidenceResolved !== true ||
      item.expansionId === null
    ) {
      continue;
    }

    if (max === null || item.expansionId > max) {
      max = item.expansionId;
    }
  }

  return max;
}

export function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    Math.round(
      (values.reduce((total, value) => total + value, 0) /
        values.length) *
        10
    ) / 10
  );
}

export function normalizeInput(
  slotKey: GearSlotKey,
  input: GearSlotInput
): GearSlotInput {
  const definition = findGearSlotDefinition(slotKey);

  if (!definition?.supportsEnchant) {
    return {
      ...input,
      enchantStatus: "NOT_APPLICABLE",
      enchantName: undefined
    };
  }

  return input;
}
