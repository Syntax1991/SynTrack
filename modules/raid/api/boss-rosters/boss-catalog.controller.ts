import type { RequestHandler } from "express";
import { RaidBossCatalogService } from "./boss-catalog.service.js";
import {
  raidBossIdSchema,
  raidBossInputSchema,
  raidEventIdParamSchema
} from "./boss-roster.validation.js";

export class RaidBossCatalogController {
  constructor(
    private readonly service:
      RaidBossCatalogService
  ) {}

  createBoss: RequestHandler = async (
    request,
    response
  ) => {
    const eventId =
      raidEventIdParamSchema.parse(
        request.params.eventId
      );

    const input =
      raidBossInputSchema.parse(
        request.body
      );

    const boss =
      await this.service.createBoss(
        eventId,
        input
      );

    response
      .status(201)
      .json(boss);
  };

  updateBoss: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidBossIdSchema.parse(
        request.params.bossId
      );

    const input =
      raidBossInputSchema.parse(
        request.body
      );

    const boss =
      await this.service.updateBoss(
        bossId,
        input
      );

    response.json(boss);
  };

  deleteBoss: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidBossIdSchema.parse(
        request.params.bossId
      );

    await this.service.deleteBoss(
      bossId
    );

    response.status(204).send();
  };
}
