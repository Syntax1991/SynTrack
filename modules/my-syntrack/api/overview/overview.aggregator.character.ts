import type { OverviewAggregationInput } from "./overview.aggregator.js";
import {
  resolveGearInput,
  resolveProfessionInput,
  resolveProfessionKnowledgeTreasureInput,
  resolveProfessionWeeklyInput,
  resolveResourceInput,
  resolveVaultInput,
  resolveWeeklyInput
} from "./overview.aggregator.inputs.js";
import { resolveGearOverviewState } from "./overview-gear-state.mapper.js";
import { resolveProfessionOverviewState } from "./overview-profession-state.mapper.js";
import { resolveProfessionKnowledgeTreasureOverviewState } from "./overview-profession-knowledge-treasure-state.mapper.js";
import { resolveProfessionWeeklyOverviewState } from "./overview-profession-weekly-state.mapper.js";
import { resolveResourceOverviewState } from "./overview-resource-state.mapper.js";
import { resolveVaultOverviewState } from "./overview-vault-state.mapper.js";
import { resolveWeeklyOverviewState } from "./overview-weekly-state.mapper.js";
import {
  resolveEmbellishmentOverviewState,
  resolveTierOverviewState
} from "./overview-tier-embellishment-state.mapper.js";
import { pickNextAction } from "./overview.sorting.js";
import type {
  AttentionItem,
  CharacterWeeklyState
} from "./overview.types.js";

export function resolveCharacterState(
  character: OverviewAggregationInput["characters"][number],
  input: OverviewAggregationInput
): CharacterWeeklyState {
  const weeklyResult = resolveWeeklyOverviewState(
    resolveWeeklyInput(character, input),
    input.weeklyTaskCount
  );

  const vaultResult = resolveVaultOverviewState(
    resolveVaultInput(character, input)
  );

  const gearResult = resolveGearOverviewState(
    resolveGearInput(character, input)
  );

  const professionResult = resolveProfessionOverviewState(
    resolveProfessionInput(character, input)
  );

  const resourceResult = resolveResourceOverviewState(
    resolveResourceInput(character, input)
  );

  const professionWeeklyResult =
    resolveProfessionWeeklyOverviewState(
      resolveProfessionWeeklyInput(character, input)
    );

  const professionKnowledgeTreasureResult =
    resolveProfessionKnowledgeTreasureOverviewState(
      resolveProfessionKnowledgeTreasureInput(character, input)
    );

  const attentionItems = [
    weeklyResult.attentionItem,
    professionResult.attentionItem,
    professionWeeklyResult.attentionItem,
    professionKnowledgeTreasureResult.attentionItem,
    gearResult.attentionItem,
    resourceResult.attentionItem,
    vaultResult.attentionItem
  ].filter((item): item is AttentionItem => item !== null);

  const anyDomainReady =
    weeklyResult.weekly.state === "READY" ||
    vaultResult.vault.state === "READY" ||
    professionResult.professions.state === "READY" ||
    gearResult.gear.state === "READY" ||
    resourceResult.resources.state === "READY" ||
    professionWeeklyResult.professionWeekly.state === "READY";

  const readinessState =
    attentionItems.length > 0
      ? "attention"
      : anyDomainReady
        ? "ready"
        : "unknown";

  return {
    character,
    weekly: weeklyResult.weekly,
    vault: vaultResult.vault,
    professions: professionResult.professions,
    gear: gearResult.gear,
    resources: resourceResult.resources,
    tier: resolveTierOverviewState(),
    embellishments: resolveEmbellishmentOverviewState(),
    professionWeekly: professionWeeklyResult.professionWeekly,
    professionKnowledgeTreasures:
      professionKnowledgeTreasureResult.professionKnowledgeTreasures,
    trackers:
      input.trackerStatesByCharacterId.get(character.id) ?? [],
    attentionItems,
    readinessState,
    nextAction: pickNextAction(attentionItems)
  };
}
