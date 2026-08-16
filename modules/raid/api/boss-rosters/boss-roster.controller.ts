import type {
  RequestHandler
} from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import { RaidBossRosterService } from "./boss-roster.service.js";
import {
  raidBossIdSchema,
  raidBossMemberIdSchema,
  raidBossRosterEntryInputSchema,
  raidBossRosterEntrySpecInputSchema,
  raidSetupIdParamSchema
} from "./boss-roster.validation.js";

export class RaidBossRosterController {
  constructor(
    private readonly service:
      RaidBossRosterService
  ) {}

  listForSetup: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidSetupIdParamSchema.parse(
        request.params.setupId
      );

    const token =
      requireBearerToken(request);

    const bosses =
      await this.service.listForSetup(
        token,
        setupId
      );

    response.json({
      items: bosses,
      total: bosses.length
    });
  };

  setEntry: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidBossIdSchema.parse(
        request.params.bossId
      );

    const memberId =
      raidBossMemberIdSchema.parse(
        request.params.memberId
      );

    const token =
      requireBearerToken(request);

    const input =
      raidBossRosterEntryInputSchema.parse(
        request.body
      );

    const boss =
      await this.service.setEntry(
        token,
        bossId,
        setupId,
        memberId,
        input.status
      );

    response.json(boss);
  };

  clearEntry: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidBossIdSchema.parse(
        request.params.bossId
      );

    const memberId =
      raidBossMemberIdSchema.parse(
        request.params.memberId
      );

    const token =
      requireBearerToken(request);

    const boss =
      await this.service.clearEntry(
        token,
        bossId,
        setupId,
        memberId
      );

    response.json(boss);
  };

  setSpec: RequestHandler = async (
    request,
    response
  ) => {
    const setupId =
      raidSetupIdParamSchema.parse(
        request.params.setupId
      );

    const bossId =
      raidBossIdSchema.parse(
        request.params.bossId
      );

    const memberId =
      raidBossMemberIdSchema.parse(
        request.params.memberId
      );

    const token =
      requireBearerToken(request);

    const input =
      raidBossRosterEntrySpecInputSchema.parse(
        request.body
      );

    const boss =
      await this.service.setSpec(
        token,
        bossId,
        setupId,
        memberId,
        input.specId
      );

    response.json(boss);
  };
}
