import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GuildTeamRepository } from "../../../guild/api/teams/team.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidBossRosterRepository } from "../boss-rosters/boss-roster.repository.js";
import { findRaidByName } from "../../shared/catalog/raidCatalog.js";
import { RaidPlannerRepository } from "./planner.repository.js";
import type {
  RaidEventInput,
  RaidEventWithTeam
} from "./planner.types.js";

export class RaidPlannerService {
  constructor(
    private readonly repository:
      RaidPlannerRepository,

    private readonly teamRepository:
      GuildTeamRepository,

    private readonly bossRosterRepository:
      RaidBossRosterRepository,

    private readonly verification:
      GuildVerificationGuard
  ) {}

  async list(): Promise<
    RaidEventWithTeam[]
  > {
    const [events, teams] =
      await Promise.all([
        this.repository.findAll(),
        this.teamRepository.findAll()
      ]);

    const teamNameById = new Map(
      teams.map((team) => [
        team.id,
        team.name
      ])
    );

    return events.map(
      (event) => ({
        ...event,
        teamName: event.teamId
          ? (teamNameById.get(
              event.teamId
            ) ?? null)
          : null
      })
    );
  }

  async create(
    token: string,
    input: RaidEventInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    await this.assertTeamExists(
      input.teamId
    );

    const normalized =
      this.normalize(input);

    const event =
      await this.repository.create(
        normalized
      );

    await this.seedBossesFromCatalog(
      event.id,
      normalized.raidInstance
    );

    return event;
  }

  async update(
    token: string,
    eventId: string,
    input: RaidEventInput
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const existing =
      await this.repository.findById(
        eventId
      );

    if (!existing) {
      throw new AppError(
        404,
        "Raid-Termin nicht gefunden."
      );
    }

    await this.assertTeamExists(
      input.teamId
    );

    return this.repository.update(
      eventId,
      this.normalize(input)
    );
  }

  async delete(
    token: string,
    eventId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const existing =
      await this.repository.findById(
        eventId
      );

    if (!existing) {
      throw new AppError(
        404,
        "Raid-Termin nicht gefunden."
      );
    }

    await this.repository.delete(
      eventId
    );
  }

  private async assertTeamExists(
    teamId: string | null
  ) {
    if (!teamId) {
      return;
    }

    const team =
      await this.teamRepository.findById(
        teamId
      );

    if (!team) {
      throw new AppError(
        400,
        "Das ausgewählte Team existiert nicht."
      );
    }
  }

  private async seedBossesFromCatalog(
    eventId: string,
    raidInstance: string
  ) {
    const raid =
      findRaidByName(raidInstance);

    if (!raid) {
      return;
    }

    for (const boss of raid.bosses) {
      await this.bossRosterRepository.createBoss(
        eventId,
        {
          name: boss.name,
          sortOrder: boss.sortOrder
        }
      );
    }
  }

  private normalize(
    input: RaidEventInput
  ): RaidEventInput {
    return {
      ...input,
      title: input.title.trim(),
      raidInstance:
        input.raidInstance.trim(),
      notes:
        input.notes?.trim() ||
        null
    };
  }
}
