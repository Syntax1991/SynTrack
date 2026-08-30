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

/*
 * Compact Vault cell: always knownUnlocked/maxSlots.
 * Partial/unknown category state stays on the read model and is shown via
 * tooltip / tone — never as a ≥ prefix in the matrix cell.
 */
export function formatVaultSlotSymbol(input: {
  knownUnlockedSlots: number;
  maxSlots: number;
}): string {
  if (input.maxSlots <= 0) {
    return "?";
  }

  return `${input.knownUnlockedSlots}/${input.maxSlots}`;
}
