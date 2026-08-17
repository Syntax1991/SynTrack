import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidBossRosterRepository } from "./boss-roster.repository.js";
import type { RaidBossInput } from "./boss-roster.types.js";

/**
 * The RaidBoss entity itself (name, sort order, existence) — separate
 * from RaidBossRosterService, which owns composition (who's playing
 * it, with what status/spec). Split out to keep boss-roster.service.ts
 * under the architecture line limit; both share the same thin
 * repository since neither owns distinct storage.
 *
 * Mutations require the CURRENT request's authenticated officer
 * (`requireCurrentOfficer`), the same standard already used by
 * RaidSetupService/RaidBossRosterService mutations — not
 * `ensureVerified()`, which only proves the guild was verified by
 * *someone*, *once*, ever, with no check on who is calling right now.
 * Deleting a boss cascades through its entire composition (roster
 * entries, cooldown plan members, assignments, phase markers, ability
 * casts), so this is the most consequential mutation in the module
 * and must not be the most weakly guarded one.
 */
export class RaidBossCatalogService {
  constructor(
    private readonly repository:
      RaidBossRosterRepository,

    private readonly verification:
      GuildVerificationGuard
  ) {}

  async createBoss(
    token: string,
    eventId: string,
    input: RaidBossInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const event =
      await this.repository.findEventById(
        eventId
      );

    if (!event) {
      throw new AppError(
        404,
        "Raid-Termin nicht gefunden."
      );
    }

    return this.repository.createBoss(
      eventId,
      this.normalize(input)
    );
  }

  async updateBoss(
    token: string,
    bossId: string,
    input: RaidBossInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

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

    return this.repository.updateBoss(
      bossId,
      this.normalize(input)
    );
  }

  async deleteBoss(
    token: string,
    bossId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

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

    await this.repository.deleteBoss(
      bossId
    );
  }

  private normalize(
    input: RaidBossInput
  ): RaidBossInput {
    return {
      ...input,
      name: input.name.trim()
    };
  }
}
