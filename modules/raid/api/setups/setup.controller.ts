import type { RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { RaidSetupService } from "./setup.service.js";
import {
  raidSetupCreateInputSchema,
  raidSetupEventIdParamSchema,
  raidSetupIdParamSchema,
  raidSetupMemberIdParamSchema,
  raidSetupMembersInputSchema
} from "./setup.validation.js";

export class RaidSetupController {
  constructor(
    private readonly service: RaidSetupService
  ) {}

  getForEvent: RequestHandler = async (
    request,
    response
  ) => {
    const eventId = raidSetupEventIdParamSchema.parse(
      request.params.eventId
    );

    const token = requireBearerToken(request);

    const setup = await this.service.getForEvent(
      token,
      eventId
    );

    response.json(setup);
  };

  listForEvent: RequestHandler = async (
    request,
    response
  ) => {
    const eventId = raidSetupEventIdParamSchema.parse(
      request.params.eventId
    );

    const token = requireBearerToken(request);

    const setups = await this.service.listForEvent(
      token,
      eventId
    );

    response.json({
      items: setups,
      total: setups.length
    });
  };

  createSetup: RequestHandler = async (
    request,
    response
  ) => {
    const eventId = raidSetupEventIdParamSchema.parse(
      request.params.eventId
    );

    const token = requireBearerToken(request);

    const input = raidSetupCreateInputSchema.parse(
      request.body
    );

    const setup = await this.service.createSetup(
      token,
      eventId,
      input.name
    );

    response.status(201).json(setup);
  };

  addMembers: RequestHandler = async (
    request,
    response
  ) => {
    const setupId = raidSetupIdParamSchema.parse(
      request.params.setupId
    );

    const token = requireBearerToken(request);

    const input = raidSetupMembersInputSchema.parse(
      request.body
    );

    const setup = await this.service.addMembers(
      token,
      setupId,
      input.memberIds
    );

    response.json(setup);
  };

  removeMember: RequestHandler = async (
    request,
    response
  ) => {
    const setupId = raidSetupIdParamSchema.parse(
      request.params.setupId
    );

    const memberId = raidSetupMemberIdParamSchema.parse(
      request.params.memberId
    );

    const token = requireBearerToken(request);

    const setup = await this.service.removeMember(
      token,
      setupId,
      memberId
    );

    response.json(setup);
  };

  updateRosterFromTeam: RequestHandler = async (
    request,
    response
  ) => {
    const setupId = raidSetupIdParamSchema.parse(
      request.params.setupId
    );

    const token = requireBearerToken(request);

    const setup = await this.service.updateRosterFromTeam(
      token,
      setupId
    );

    response.json(setup);
  };
}
