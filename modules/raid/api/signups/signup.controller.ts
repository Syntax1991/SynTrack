import type {
  RequestHandler
} from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { RaidSignupService } from "./signup.service.js";
import {
  raidEventIdParamSchema,
  raidSignupInputSchema,
  raidSignupMemberIdSchema
} from "./signup.validation.js";

export class RaidSignupController {
  constructor(
    private readonly service:
      RaidSignupService
  ) {}

  listForEvent: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdParamSchema.parse(
        request.params.eventId
      );

    const items =
      await this.service.listForEvent(
        eventId
      );

    response.json({
      items,
      total: items.length
    });
  };

  setSignup: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdParamSchema.parse(
        request.params.eventId
      );

    const memberId =
      raidSignupMemberIdSchema.parse(
        request.params.memberId
      );

    const input =
      raidSignupInputSchema.parse(
        request.body
      );

    const token =
      requireBearerToken(request);

    response.json(
      await this.service.setSignup(
        token,
        eventId,
        memberId,
        input.status
      )
    );
  };

  setOwnSignup: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdParamSchema.parse(
        request.params.eventId
      );

    const token =
      requireBearerToken(request);

    const input =
      raidSignupInputSchema.parse(
        request.body
      );

    response.json(
      await this.service.setOwnSignup(
        eventId,
        token,
        input.status
      )
    );
  };

  clearSignup: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdParamSchema.parse(
        request.params.eventId
      );

    const memberId =
      raidSignupMemberIdSchema.parse(
        request.params.memberId
      );

    const token =
      requireBearerToken(request);

    await this.service.clearSignup(
      token,
      eventId,
      memberId
    );

    response.status(204).send();
  };
}
