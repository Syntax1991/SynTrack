import type { VaultActivitySlot } from "./weekly-gameplay.vault.js";

export function nextUnmetVaultSlotAction(
  slots: VaultActivitySlot[],
  wording: {
    unitSingular: string;
    unitPlural: string;
  }
): string | null {
  if (slots.length === 0) {
    return null;
  }

  const progress = Math.max(...slots.map((slot) => slot.progress));
  const slotNumber = slots.findIndex((slot) => progress < slot.threshold);

  if (slotNumber < 0) {
    return null;
  }

  const unmet = slots[slotNumber];

  if (!unmet) {
    return null;
  }

  const remaining = unmet.threshold - progress;
  const unit = remaining === 1 ? wording.unitSingular : wording.unitPlural;
  const more = progress > 0 ? " more" : "";

  return `${remaining}${more} ${unit} for Vault slot ${slotNumber + 1}`;
}
