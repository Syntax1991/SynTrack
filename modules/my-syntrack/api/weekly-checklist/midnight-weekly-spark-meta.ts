/**
 * Derive logical Weeklies META completion from per-quest evidence.
 *
 * Rules:
 * - any eligible true → COMPLETE
 * - every eligible known false → INCOMPLETE
 * - no true + any unresolved → UNKNOWN
 * - empty eligible set → UNKNOWN
 */

export type MetaQuestEvidenceState = boolean | null;

export type MetaQuestEvidenceEntry = {
  questId: number;
  flaggedCompleted: MetaQuestEvidenceState;
};

export type DerivedMetaQuestCompletion = {
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  /** Quest that proved completion, else null. */
  determiningQuestId: number | null;
  flaggedCompleted: boolean | null;
};

export function deriveMetaQuestCompletion(
  evidence: readonly MetaQuestEvidenceEntry[],
  eligibleQuestIds: readonly number[]
): DerivedMetaQuestCompletion {
  if (eligibleQuestIds.length === 0) {
    return {
      state: "UNKNOWN",
      determiningQuestId: null,
      flaggedCompleted: null
    };
  }

  const byId = new Map(
    evidence.map((entry) => [entry.questId, entry.flaggedCompleted])
  );

  let knownFalseCount = 0;
  let unresolvedCount = 0;
  let firstFalseId: number | null = null;

  for (const questId of eligibleQuestIds) {
    const flagged = byId.has(questId)
      ? byId.get(questId)!
      : null;

    if (flagged === true) {
      return {
        state: "COMPLETE",
        determiningQuestId: questId,
        flaggedCompleted: true
      };
    }

    if (flagged === false) {
      knownFalseCount += 1;
      firstFalseId ??= questId;
      continue;
    }

    unresolvedCount += 1;
  }

  if (
    knownFalseCount === eligibleQuestIds.length &&
    unresolvedCount === 0
  ) {
    return {
      state: "INCOMPLETE",
      determiningQuestId: firstFalseId,
      flaggedCompleted: false
    };
  }

  return {
    state: "UNKNOWN",
    determiningQuestId: null,
    flaggedCompleted: null
  };
}
