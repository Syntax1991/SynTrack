import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { WeeklyChecklistService } from "../weekly-checklist/weekly-checklist.service.js";
import { VaultMythicPlusRepository } from "../vault-mythic-plus/vault-mythic-plus.repository.js";
import { VaultMythicPlusService } from "../vault-mythic-plus/vault-mythic-plus.service.js";
import { GearReadinessRepository } from "../gear-readiness/gear-readiness.repository.js";
import { GearReadinessService } from "../gear-readiness/gear-readiness.service.js";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { loadProfessionIssuesByCharacter } from "./overview.profession-issues.js";
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

  async getOverview(): Promise<OverviewResponse> {
    const [
      weeklyChecklist,
      vaultOverview,
      gearOverview,
      professionIssuesByCharacter
    ] = await Promise.all([
      this.weeklyChecklistService.getChecklist(),
      this.vaultMythicPlusService.getOverview(),
      this.gearReadinessService.getOverview(),
      loadProfessionIssuesByCharacter()
    ]);

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
        professionByCharacterId
      });

    return {
      summary,
      attentionItems,
      characters
    };
  }
}
