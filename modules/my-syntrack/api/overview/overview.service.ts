import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { WeeklyChecklistService } from "../weekly-checklist/weekly-checklist.service.js";
import { VaultMythicPlusRepository } from "../vault-mythic-plus/vault-mythic-plus.repository.js";
import { VaultMythicPlusService } from "../vault-mythic-plus/vault-mythic-plus.service.js";
import { GearReadinessRepository } from "../gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../gear-readiness/gear-readiness.service.js";
import { ACTIVE_TRACKER_SCOPE_KEY } from "../trackers/active-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerDefinitionService } from "../trackers/tracker-definition.service.js";
import { TrackerValueRepository } from "../trackers/tracker-value.repository.js";
import { TrackerValueService } from "../trackers/tracker-value.service.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { loadProfessionIssuesByCharacter } from "./overview.profession-issues.js";
import { filterPinnedTrackerColumns } from "./overview-tracker-columns.js";
import type { OverviewResponse } from "./overview.types.js";

/*
 * Read-model orchestrator for the "My SynTrack" Overview. It owns no
 * completion state of its own - it calls the exact same domain services
 * Weekly Checklist, Vault/M+, Gear and Professions already use, then
 * normalizes and prioritizes the result (see overview.aggregator.ts).
 * A future duplicate-state bug class (a second "is this done" answer
 * diverging from the domain's own) is structurally impossible here
 * because no completion math is reimplemented - only read and reshaped.
 */
export class OverviewService {
  private readonly weeklyChecklistService =
    new WeeklyChecklistService(
      new WeeklyChecklistRepository()
    );

  private readonly vaultMythicPlusService =
    new VaultMythicPlusService(
      new VaultMythicPlusRepository()
    );

  private readonly gearReadinessService =
    new GearReadinessService(
      new GearReadinessRepository()
    );

  private readonly trackerDefinitionService =
    new TrackerDefinitionService(
      new TrackerDefinitionRepository()
    );

  private readonly trackerValueService =
    new TrackerValueService(
      new TrackerValueRepository(),
      new TrackerDefinitionRepository()
    );

  async getOverview(): Promise<OverviewResponse> {
    const [
      weeklyChecklist,
      vaultOverview,
      gearOverview,
      professionIssuesByCharacter,
      trackerDefinitions
    ] = await Promise.all([
      this.weeklyChecklistService.getChecklist(),
      this.vaultMythicPlusService.getOverview(),
      this.gearReadinessService.getOverview(),
      loadProfessionIssuesByCharacter(),
      this.trackerDefinitionService.listByScope(
        ACTIVE_TRACKER_SCOPE_KEY
      )
    ]);

    const trackerColumns =
      filterPinnedTrackerColumns(
        trackerDefinitions
      );

    const characterIds =
      weeklyChecklist.characters.map(
        (character) => character.id
      );

    const trackerStates =
      trackerColumns.length === 0
        ? []
        : await this.trackerValueService.getStatesForScope(
            ACTIVE_TRACKER_SCOPE_KEY,
            characterIds
          );

    const pinnedTrackerDefinitionIds =
      new Set(
        trackerColumns.map(
          (definition) => definition.id
        )
      );

    const trackerStatesByCharacterId =
      new Map<
        string,
        CharacterTrackerState[]
      >();

    for (const state of trackerStates) {
      if (
        !pinnedTrackerDefinitionIds.has(
          state.trackerDefinitionId
        )
      ) {
        continue;
      }

      const existing =
        trackerStatesByCharacterId.get(
          state.characterId
        ) ?? [];

      existing.push(state);
      trackerStatesByCharacterId.set(
        state.characterId,
        existing
      );
    }

    const weeklyByCharacterId =
      new Map(
        weeklyChecklist.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const vaultByCharacterId =
      new Map(
        vaultOverview.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const gearByCharacterId =
      new Map(
        gearOverview.characters.map(
          (character) => [
            character.id,
            character
          ]
        )
      );

    const professionByCharacterId =
      new Map(
        [
          ...professionIssuesByCharacter.entries()
        ].map(
          ([
            characterId,
            entry
          ]) => [
            characterId,
            {
              id: characterId,
              name:
                weeklyByCharacterId.get(
                  characterId
                )?.name ?? "",
              hasTrackedProfession:
                entry.hasTrackedProfession,
              partialProfessionIssues:
                entry.partialIssues
            }
          ]
        )
      );

    const {
      characters,
      attentionItems,
      summary
    } =
      aggregateCharacterWeeklyStates({
        period:
          weeklyChecklist.period,
        weeklyTaskCount:
          weeklyChecklist.tasks
            .length,
        characters:
          weeklyChecklist.characters.map(
            (character) => ({
              id: character.id,
              name: character.name,
              realm: character.realm,
              region:
                character.region,
              className:
                character.className,
              level: character.level
            })
          ),
        weeklyByCharacterId,
        vaultByCharacterId,
        gearByCharacterId,
        professionByCharacterId,
        trackerStatesByCharacterId
      });

    return {
      summary,
      attentionItems,
      characters,
      trackerColumns
    };
  }
}
