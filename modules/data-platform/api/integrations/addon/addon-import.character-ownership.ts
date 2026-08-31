import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";

/*
 * Ownership rules for Character.raiderAccountId during device import:
 * - Never guess from BattleTag or "single user" heuristics.
 * - Unowned row + proven owner credential → claim (first proven import).
 * - Same owner → allow update.
 * - Different owner → refuse (UNKNOWN > WRONG; no cross-account takeover).
 * - No owner on credential (legacy / web path) → leave ownership untouched.
 */
export function resolveCharacterOwnerUpdate(input: {
  existingOwnerId: string | null;
  incomingOwnerId: string | null | undefined;
  characterLabel: string;
}): string | null | undefined {
  const { existingOwnerId, incomingOwnerId, characterLabel } =
    input;

  if (!incomingOwnerId) {
    return undefined;
  }

  if (
    existingOwnerId &&
    existingOwnerId !== incomingOwnerId
  ) {
    throw new AppError(
      409,
      `Character ${characterLabel} is owned by another SynTrack account.`
    );
  }

  if (!existingOwnerId) {
    return incomingOwnerId;
  }

  return undefined;
}
