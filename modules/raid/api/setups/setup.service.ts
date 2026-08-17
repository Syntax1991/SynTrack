import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import { GuildTeamRepository } from "../../../guild/api/teams/team.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidSetupRepository } from "./setup.repository.js";
import type { RaiderLinkGuard } from "./setup.types.js";

type SetupWithMembers = NonNullable<
  Awaited<ReturnType<RaidSetupRepository["findSetupById"]>>
>;

export class RaidSetupService {
  constructor(
    private readonly repository: RaidSetupRepository,
    private readonly rosterRepository: GuildRosterRepository,
    private readonly teamRepository: GuildTeamRepository,
    private readonly verification: GuildVerificationGuard,
    private readonly raiderLink: RaiderLinkGuard
  ) {}

  async getForEvent(token: string, eventId: string) {
    await this.requireLinkedMember(token);

    const setup = await this.repository.getOrCreateForEvent(eventId);

    if (!setup) {
      throw new AppError(404, "Raid-Termin nicht gefunden.");
    }

    return this.enrichSetup(setup);
  }

  /**
   * Every Setup for the event, "main" included — bootstraps "main"
   * first (via getOrCreateForEvent) so an event that's never been
   * opened yet still returns a non-empty list instead of forcing the
   * caller to separately know to call getForEvent first.
   */
  async listForEvent(
    token: string,
    eventId: string
  ) {
    await this.requireLinkedMember(token);

    const bootstrapped =
      await this.repository.getOrCreateForEvent(
        eventId
      );

    if (!bootstrapped) {
      throw new AppError(
        404,
        "Raid-Termin nicht gefunden."
      );
    }

    const setups =
      await this.repository.findAllForEvent(
        eventId
      );

    return Promise.all(
      setups.map((setup) =>
        this.enrichSetup(setup)
      )
    );
  }

  /**
   * A genuinely new, empty Setup for this event — never copies
   * another Setup's pool/lineup/plan. Officer-gated like every other
   * Setup mutation; read access (listForEvent/getForEvent) only needs
   * a linked member.
   */
  async createSetup(
    token: string,
    eventId: string,
    name: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    const setup =
      await this.repository.createSetup(
        eventId,
        name
      );

    if (!setup) {
      throw new AppError(
        404,
        "Raid-Termin nicht gefunden."
      );
    }

    return this.enrichSetup(setup);
  }

  async addMembers(
    token: string,
    setupId: string,
    memberIds: string[]
  ) {
    await this.verification.requireCurrentOfficer(token);

    await this.requireSetup(setupId);

    const uniqueMemberIds = Array.from(new Set(memberIds));

    await this.assertMembersExist(uniqueMemberIds);

    await this.repository.addMembers(setupId, uniqueMemberIds);

    return this.enrichSetup(await this.requireSetup(setupId));
  }

  async removeMember(
    token: string,
    setupId: string,
    memberId: string
  ) {
    await this.verification.requireCurrentOfficer(token);

    await this.requireSetup(setupId);

    await this.repository.removeMember(setupId, memberId);

    return this.enrichSetup(await this.requireSetup(setupId));
  }

  /**
   * Strictly additive: adds every current team member not already in
   * the pool. Never removes a pool member who left the linked team —
   * that stays an explicit officer action, so a Setup can't shrink
   * out from under an officer mid-week just because a "Update Roster"
   * click happened to run.
   */
  async updateRosterFromTeam(
    token: string,
    setupId: string
  ) {
    await this.verification.requireCurrentOfficer(token);

    const setup = await this.requireSetup(setupId);

    if (!setup.raidEventId) {
      throw new AppError(
        400,
        "Dieses Setup ist keinem Termin zugeordnet."
      );
    }

    const event = await this.repository.findEventById(
      setup.raidEventId
    );

    if (!event?.teamId) {
      throw new AppError(
        400,
        "Für diesen Termin ist kein Team verknüpft. Verknüpfe zuerst ein Team, um den Roster zu synchronisieren."
      );
    }

    const team = await this.teamRepository.findById(
      event.teamId
    );

    if (!team) {
      throw new AppError(
        404,
        "Verknüpftes Team nicht gefunden."
      );
    }

    const memberIds = team.members.map(
      (membership) => membership.memberId
    );

    if (memberIds.length > 0) {
      await this.repository.addMembers(setupId, memberIds);
    }

    return this.enrichSetup(await this.requireSetup(setupId));
  }

  private async requireLinkedMember(token: string) {
    const member = await this.raiderLink.getLinkedMember(
      token
    );

    if (!member) {
      throw new AppError(
        403,
        "Bitte zuerst dein Battle.net-Konto verknüpfen."
      );
    }

    return member;
  }

  private async requireSetup(
    setupId: string
  ): Promise<SetupWithMembers> {
    const setup = await this.repository.findSetupById(
      setupId
    );

    if (!setup) {
      throw new AppError(
        404,
        "Setup nicht gefunden."
      );
    }

    return setup;
  }

  private async assertMembersExist(
    memberIds: string[]
  ): Promise<void> {
    const members = await Promise.all(
      memberIds.map((memberId) =>
        this.repository.findMemberById(memberId)
      )
    );

    const missingIndex = members.findIndex(
      (member) => !member
    );

    if (missingIndex !== -1) {
      throw new AppError(
        404,
        `Gildenmitglied ${memberIds[missingIndex]} nicht gefunden.`
      );
    }
  }

  private async enrichSetup(setup: SetupWithMembers) {
    const members = await this.rosterRepository.findAll();

    const memberById = new Map(
      members.map((member) => [member.id, member])
    );

    return {
      ...setup,
      members: setup.members.map((entry) => ({
        ...entry,
        member: memberById.get(entry.memberId) ?? null
      }))
    };
  }
}
