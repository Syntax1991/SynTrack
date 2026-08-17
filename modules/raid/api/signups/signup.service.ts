import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidSignupRepository } from "./signup.repository.js";
import type { RaiderLinkGuard } from "./signup.types.js";

export class RaidSignupService {
  constructor(
    private readonly repository:
      RaidSignupRepository,

    private readonly rosterRepository:
      GuildRosterRepository,

    private readonly verification:
      GuildVerificationGuard,

    private readonly raiderLink:
      RaiderLinkGuard
  ) {}

  async listForEvent(
    eventId: string
  ) {
    await this.assertEventExists(
      eventId
    );

    const [members, signups] =
      await Promise.all([
        this.rosterRepository.findAll(),
        this.repository.findSignupsForEvent(
          eventId
        )
      ]);

    const signupByMemberId = new Map(
      signups.map((signup) => [
        signup.memberId,
        signup
      ])
    );

    return members.map((member) => {
      const signup =
        signupByMemberId.get(
          member.id
        );

      return {
        member,
        status:
          signup?.status ?? null,
        updatedAt:
          signup?.updatedAt.toISOString() ??
          null
      };
    });
  }

  async setSignup(
    token: string,
    eventId: string,
    memberId: string,
    status: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    return this.upsert(
      eventId,
      memberId,
      status
    );
  }

  async setOwnSignup(
    eventId: string,
    token: string,
    status: string
  ) {
    const linkedMember =
      await this.raiderLink.getLinkedMember(
        token
      );

    if (!linkedMember) {
      throw new AppError(
        403,
        "Bitte zuerst dein Battle.net-Konto unter „My Raider Login“ mit deinem Gildenmitglied verknüpfen."
      );
    }

    return this.upsert(
      eventId,
      linkedMember.id,
      status
    );
  }

  async clearSignup(
    token: string,
    eventId: string,
    memberId: string
  ) {
    await this.verification.requireCurrentOfficer(
      token
    );

    await this.assertEventExists(
      eventId
    );

    await this.repository.deleteSignup(
      eventId,
      memberId
    );
  }

  private async upsert(
    eventId: string,
    memberId: string,
    status: string
  ) {
    await this.assertEventExists(
      eventId
    );

    const member =
      await this.repository.findMemberById(
        memberId
      );

    if (!member) {
      throw new AppError(
        404,
        "Gildenmitglied nicht gefunden."
      );
    }

    const signup =
      await this.repository.upsertSignup(
        eventId,
        memberId,
        status
      );

    return {
      member,
      status: signup.status,
      updatedAt:
        signup.updatedAt.toISOString()
    };
  }

  private async assertEventExists(
    eventId: string
  ): Promise<void> {
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
  }
}
