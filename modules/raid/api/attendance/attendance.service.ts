import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidAttendanceRepository } from "./attendance.repository.js";

export class RaidAttendanceService {
  constructor(
    private readonly repository:
      RaidAttendanceRepository,

    private readonly rosterRepository:
      GuildRosterRepository,

    private readonly verification:
      GuildVerificationGuard
  ) {}

  async listSummary() {
    const [events, members] =
      await Promise.all([
        this.repository.findAllEventsWithRecords(),
        this.rosterRepository.findAll()
      ]);

    const memberById = new Map(
      members.map((member) => [
        member.id,
        member
      ])
    );

    return events.map((event) => ({
      ...event,
      attendanceRecords:
        event.attendanceRecords.map(
          (record) => ({
            ...record,
            member:
              memberById.get(
                record.memberId
              ) ?? null
          })
        )
    }));
  }

  async getEventAttendance(
    eventId: string
  ) {
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

    return this.enrichRecords(eventId);
  }

  async setRecord(
    token: string,
    eventId: string,
    memberId: string,
    status: string
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

    await this.repository.upsertRecord(
      eventId,
      memberId,
      status
    );

    return this.enrichRecords(eventId);
  }

  async clearRecord(
    token: string,
    eventId: string,
    memberId: string
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

    await this.repository.deleteRecord(
      eventId,
      memberId
    );

    return this.enrichRecords(eventId);
  }

  private async enrichRecords(
    eventId: string
  ) {
    const [records, members] =
      await Promise.all([
        this.repository.findRecordsForEvent(
          eventId
        ),
        this.rosterRepository.findAll()
      ]);

    const memberById = new Map(
      members.map((member) => [
        member.id,
        member
      ])
    );

    return records.map((record) => ({
      ...record,
      member:
        memberById.get(
          record.memberId
        ) ?? null
    }));
  }
}
