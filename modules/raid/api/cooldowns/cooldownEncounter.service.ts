import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidCooldownRepository } from "./cooldown.repository.js";
import type {
  RaidBossFightDurationInput,
  RaidBossPhaseMarkerInput
} from "./cooldown.types.js";
import { WarcraftLogsClient } from "./warcraftlogs.client.js";

/**
 * Encounter facts — WCL casts, phase markers, fight duration — belong
 * to the boss/fight itself, never to a particular Setup's composition.
 * These stay boss-scoped regardless of how many Setups exist for the
 * event, unlike RaidCooldownService's plan members/assignments.
 */
export class RaidCooldownEncounterService {
  constructor(
    private readonly repository:
      RaidCooldownRepository,

    private readonly verification:
      GuildVerificationGuard,

    private readonly warcraftLogs:
      WarcraftLogsClient
  ) {}

  async updateFightDuration(
    bossId: string,
    input: RaidBossFightDurationInput
  ) {
    await this.verification.ensureVerified();

    await this.requireBoss(bossId);

    return this.repository.updateFightDuration(
      bossId,
      input
    );
  }

  listPhaseMarkers(bossId: string) {
    return this.repository.findPhaseMarkersForBoss(
      bossId
    );
  }

  async createPhaseMarker(
    bossId: string,
    input: RaidBossPhaseMarkerInput
  ) {
    await this.verification.ensureVerified();

    await this.requireBoss(bossId);

    return this.repository.createPhaseMarker(
      bossId,
      {
        ...input,
        label: input.label.trim()
      }
    );
  }

  async deletePhaseMarker(
    markerId: string
  ) {
    await this.verification.ensureVerified();

    const marker =
      await this.repository.findPhaseMarkerById(
        markerId
      );

    if (!marker) {
      throw new AppError(
        404,
        "Phasen-Marker nicht gefunden."
      );
    }

    await this.repository.deletePhaseMarker(
      markerId
    );
  }

  listAbilityCasts(bossId: string) {
    return this.repository.findAbilityCastsForBoss(
      bossId
    );
  }

  async syncBossFromWarcraftLogs(
    bossId: string
  ) {
    await this.verification.ensureVerified();

    const boss = await this.requireBoss(
      bossId
    );

    const encounterId =
      await this.warcraftLogs.findEncounterId(
        boss.name
      );

    if (encounterId === null) {
      throw new AppError(
        404,
        "Für diesen Boss gibt es noch keine Logs auf Warcraft Logs."
      );
    }

    const topFight =
      await this.warcraftLogs.getTopFight(
        encounterId
      );

    if (!topFight) {
      throw new AppError(
        404,
        "Für diesen Boss gibt es noch keine Logs auf Warcraft Logs."
      );
    }

    const fightCasts =
      await this.warcraftLogs.getFightCasts(
        topFight.reportCode,
        topFight.fightId,
        boss.name
      );

    if (!fightCasts) {
      throw new AppError(
        404,
        "Für diesen Boss gibt es noch keine Logs auf Warcraft Logs."
      );
    }

    await this.repository.replaceAbilityCastsFromSync(
      bossId,
      {
        fightDurationSeconds:
          fightCasts.fightDurationSeconds,
        wclReportCode:
          fightCasts.reportCode,
        wclFightId: fightCasts.fightId,
        casts: fightCasts.casts
      }
    );

    return {
      boss: await this.requireBoss(
        bossId
      ),
      casts:
        await this.repository.findAbilityCastsForBoss(
          bossId
        )
    };
  }

  private async requireBoss(
    bossId: string
  ) {
    const boss =
      await this.repository.findBossById(
        bossId
      );

    if (!boss) {
      throw new AppError(
        404,
        "Boss nicht gefunden."
      );
    }

    return boss;
  }
}
