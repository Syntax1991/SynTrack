import {
  deriveEmbellishmentOverviewState,
  deriveTierOverviewState,
  type GearTierEmbellishmentInput,
  type GearTierEmbellishmentSlotInput
} from "../gear-readiness/gear-tier-embellishment.deriver.js";
import type {
  EmbellishmentOverviewState,
  TierOverviewState
} from "./overview.types.js";

export type OverviewTierEmbellishmentSlotInput =
  GearTierEmbellishmentSlotInput;

export type OverviewTierEmbellishmentCharacterInput =
  GearTierEmbellishmentInput;

/*
 * Wraps the gear-readiness deriver so Overview aggregation stays a thin
 * read-model seam - all confirmation rules live in one place.
 */
export function resolveTierOverviewState(
  input?: OverviewTierEmbellishmentCharacterInput
): TierOverviewState {
  if (!input) {
    return deriveTierOverviewState({ level: 0, slots: [] });
  }

  return deriveTierOverviewState(input);
}

export function resolveEmbellishmentOverviewState(
  input?: OverviewTierEmbellishmentCharacterInput
): EmbellishmentOverviewState {
  if (!input) {
    return deriveEmbellishmentOverviewState({ level: 0, slots: [] });
  }

  return deriveEmbellishmentOverviewState(input);
}
