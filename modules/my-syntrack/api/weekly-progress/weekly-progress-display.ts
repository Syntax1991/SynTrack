/*
 * Known weekly progress symbol — numeric fraction uses only authoritative
 * compatible units; unresolved domains stay in the separate · N? suffix.
 */
export function formatKnownWeeklyProgressSymbol(input: {
  completedKnown: number;
  applicableKnown: number;
  unknownCount: number;
}): string {
  const { completedKnown, applicableKnown, unknownCount } = input;

  if (applicableKnown <= 0) {
    return unknownCount > 0 ? `0 · ${unknownCount}?` : "—";
  }

  const fraction = `${completedKnown}/${applicableKnown}`;

  if (unknownCount > 0) {
    return `${fraction} · ${unknownCount}?`;
  }

  return fraction;
}

export function formatVaultSlotSymbol(input: {
  knownUnlockedSlots: number;
  maxSlots: number;
  hasUnknownCategories: boolean;
}): string {
  if (input.maxSlots <= 0) {
    return "?";
  }

  const fraction = `${input.knownUnlockedSlots}/${input.maxSlots}`;

  if (input.hasUnknownCategories) {
    return `≥${fraction}`;
  }

  return fraction;
}
