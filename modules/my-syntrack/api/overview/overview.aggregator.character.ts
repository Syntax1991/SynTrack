import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
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
import type { OverviewAggregationInput } from "./overview.aggregator.js";
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

  const gearInput = resolveGearInput(character, input);
  const gearResult = resolveGearOverviewState(gearInput);
  const tierEmbellishmentInput = {
    level: gearInput.level ?? character.level,
    currentExpansionId: gearInput.currentExpansionId ?? null,
    bagPieces: gearInput.bagPieces ?? [],
    slots: gearInput.slots.flatMap((slot) =>
      slot.item
        ? [
            {
              slotKey: slot.key ?? "UNKNOWN",
              expansionId: slot.item.expansionId ?? null,
              setId: slot.item.setId ?? null,
              setEvidenceResolved:
                slot.item.setEvidenceResolved ?? null,
              setBonusResolved: slot.item.setBonusResolved ?? null,
              setBonusSpellIds: slot.item.setBonusSpellIds ?? null,
              uniqueCategoryId: slot.item.uniqueCategoryId ?? null,
              uniquenessResolved:
                slot.item.uniquenessResolved ?? null
            }
          ]
        : []
    )
  };

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

  const characterTags =
    input.tagsByCharacterId?.get(character.id) ?? [];
  const weeklyGameplay =
    input.weeklyGameplayByCharacterId?.get(character.id) ?? null;

  const vault =
    weeklyGameplay && weeklyGameplay.vault.state !== "UNKNOWN"
      ? {
          state: weeklyGameplay.vault.state,
          unlockedSlots: weeklyGameplay.vault.completeCount,
          slotsTotal: weeklyGameplay.vault.applicableTotal,
          highestKeyLevel: vaultResult.vault.highestKeyLevel,
          source: "ADDON" as const
        }
      : vaultResult.vault;

  const weeklySummaryResult = resolveWeeklySummaryOverviewState({
    characterId: character.id,
    characterName: character.name,
    trackingProfile: resolveCharacterTrackingProfile(characterTags),
    vault,
    professionWeekly: professionWeeklyResult.professionWeekly,
    ...(weeklyGameplay
      ? {
          mythicPlusState: weeklyGameplay.mythicPlus.state,
          raidState: weeklyGameplay.raid.state,
          delvesState: weeklyGameplay.delves.state
        }
      : {})
  });

  const gameplayAction: AttentionItem | null =
    weeklySummaryResult.weeklyAction
      ? null
      : weeklyGameplay?.mythicPlusAction
        ? {
            id: `${character.id}:weekly-action`,
            characterId: character.id,
            characterName: character.name,
            domain: "weekly",
            severity: "this-week",
            label: weeklyGameplay.mythicPlusAction,
            detail: null,
            path: "/weekly-checklist"
          }
        : weeklyGameplay?.raidAction
          ? {
              id: `${character.id}:weekly-action`,
              characterId: character.id,
              characterName: character.name,
              domain: "weekly",
              severity: "this-week",
              label: weeklyGameplay.raidAction,
              detail: null,
              path: "/weekly-checklist"
            }
          : null;

  const weeklyAction =
    weeklySummaryResult.weeklyAction ?? gameplayAction;

  /*
   * Overview ACTION considers all character attention. Treasure
   * incompleteness is represented via professionSetup (PROF.), not a
   * duplicate treasure attention item.
   */
  const attentionItems = [
    weeklyAction,
    professionSetupResult.attentionItem,
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
    weeklyAction: weeklyAction
      ? {
          domain: weeklyAction.domain,
          label: weeklyAction.label,
          detail: weeklyAction.detail,
          path: weeklyAction.path,
          severity: weeklyAction.severity
        }
      : null,
    vault,
    professions: professionResult.professions,
    professionSetup: professionSetupResult.professionSetup,
    gear: gearResult.gear,
    resources: resourceResult.resources,
    tier: resolveTierOverviewState(tierEmbellishmentInput),
    embellishments: resolveEmbellishmentOverviewState(
      tierEmbellishmentInput
    ),
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
