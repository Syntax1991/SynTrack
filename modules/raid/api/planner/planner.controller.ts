import type {
  RequestHandler
} from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { RaidPlannerService } from "./planner.service.js";
import {
  raidEventIdSchema,
  raidEventInputSchema
} from "./planner.validation.js";

export class RaidPlannerController {
  constructor(
    private readonly service:
      RaidPlannerService
  ) {}

  list: RequestHandler = async (
    _request,
    response
  ) => {
    const events =
      await this.service.list();

    response.json({
      items: events,
      total: events.length
    });
  };

  create: RequestHandler = async (
    request,
    response
  ) => {
    const input =
      raidEventInputSchema.parse(
        request.body
      );

    const token =
      requireBearerToken(request);

    const event =
      await this.service.create(
        token,
        input
      );

    response
      .status(201)
      .json(event);
  };

  update: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdSchema.parse(
        request.params.eventId
      );

    const input =
      raidEventInputSchema.parse(
        request.body
      );

    const token =
      requireBearerToken(request);

    const event =
      await this.service.update(
        token,
        eventId,
        input
      );

    response.json(event);
  };

  delete: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdSchema.parse(
        request.params.eventId
      );

    const token =
      requireBearerToken(request);

    await this.service.delete(
      token,
      eventId
    );

    response.status(204).send();
  };
}
