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
import { resolveProfessionSetupOverviewState } from "./overview-profession-setup-state.mapper.js";
import { resolveProfessionWeeklyOverviewState } from "./overview-profession-weekly-state.mapper.js";
import { resolveResourceOverviewState } from "./overview-resource-state.mapper.js";
import { resolveVaultOverviewState } from "./overview-vault-state.mapper.js";
import { resolveWeeklyOverviewState } from "./overview-weekly-state.mapper.js";
import { resolveWeeklySummaryOverviewState } from "./overview-weekly-summary.mapper.js";
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

  const professionInput = resolveProfessionInput(character, input);
  const professionResult = resolveProfessionOverviewState(
    professionInput
  );

  const resourceResult = resolveResourceOverviewState(
    resolveResourceInput(character, input)
  );

  const professionWeeklyInput = resolveProfessionWeeklyInput(
    character,
    input
  );
  const professionWeeklyResult =
    resolveProfessionWeeklyOverviewState(professionWeeklyInput);

  const treasureInput = resolveProfessionKnowledgeTreasureInput(
    character,
    input
  );
  const professionKnowledgeTreasureResult =
    resolveProfessionKnowledgeTreasureOverviewState(treasureInput);

  const professionSetupResult = resolveProfessionSetupOverviewState({
    profession: professionInput,
    treasures: treasureInput
  });

  const weeklySummaryResult = resolveWeeklySummaryOverviewState({
    characterId: character.id,
    characterName: character.name,
    vault: vaultResult.vault,
    professionWeekly: professionWeeklyResult.professionWeekly
  });

  /*
   * Overview ACTION considers all character attention. Treasure
   * incompleteness is represented via professionSetup (PROF.), not a
   * duplicate treasure attention item.
   */
  const attentionItems = [
    weeklySummaryResult.weeklyAction,
    professionSetupResult.attentionItem,
    gearResult.attentionItem,
    resourceResult.attentionItem
  ].filter((item): item is AttentionItem => item !== null);

  const anyDomainReady =
    weeklySummaryResult.weeklySummary.state === "READY" ||
    professionSetupResult.professionSetup.state === "READY" ||
    gearResult.gear.state === "READY" ||
    resourceResult.resources.state === "READY";

  const readinessState =
    attentionItems.length > 0
      ? "attention"
      : anyDomainReady
        ? "ready"
        : "unknown";

  return {
    character,
    weekly: weeklyResult.weekly,
    weeklySummary: weeklySummaryResult.weeklySummary,
    weeklyAction: weeklySummaryResult.weeklyAction
      ? {
          domain: weeklySummaryResult.weeklyAction.domain,
          label: weeklySummaryResult.weeklyAction.label,
          detail: weeklySummaryResult.weeklyAction.detail,
          path: weeklySummaryResult.weeklyAction.path,
          severity: weeklySummaryResult.weeklyAction.severity
        }
      : null,
    vault: vaultResult.vault,
    professions: professionResult.professions,
    professionSetup: professionSetupResult.professionSetup,
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
