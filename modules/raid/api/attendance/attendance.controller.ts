import type {
  RequestHandler
} from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { RaidAttendanceService } from "./attendance.service.js";
import {
  raidAttendanceEventIdSchema,
  raidAttendanceMemberIdSchema,
  raidAttendanceRecordInputSchema
} from "./attendance.validation.js";

export class RaidAttendanceController {
  constructor(
    private readonly service:
      RaidAttendanceService
  ) {}

  listSummary: RequestHandler = async (
    _request,
    response
  ) => {
    const events =
      await this.service.listSummary();

    response.json({
      items: events,
      total: events.length
    });
  };

  getEventAttendance: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidAttendanceEventIdSchema.parse(
        request.params.eventId
      );

    const records =
      await this.service.getEventAttendance(
        eventId
      );

    response.json({
      items: records,
      total: records.length
    });
  };

  setRecord: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidAttendanceEventIdSchema.parse(
        request.params.eventId
      );

    const memberId =
      raidAttendanceMemberIdSchema.parse(
        request.params.memberId
      );

    const input =
      raidAttendanceRecordInputSchema.parse(
        request.body
      );

    const token =
      requireBearerToken(request);

    const records =
      await this.service.setRecord(
        token,
        eventId,
        memberId,
        input.status
      );

    response.json({
      items: records,
      total: records.length
    });
  };

  clearRecord: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidAttendanceEventIdSchema.parse(
        request.params.eventId
      );

    const memberId =
      raidAttendanceMemberIdSchema.parse(
        request.params.memberId
      );

    const token =
      requireBearerToken(request);

    const records =
      await this.service.clearRecord(
        token,
        eventId,
        memberId
      );

    response.json({
      items: records,
      total: records.length
    });
  };
}
