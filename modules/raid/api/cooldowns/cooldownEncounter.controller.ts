import type {
  RequestHandler
} from "express";
import { RaidCooldownEncounterService } from "./cooldownEncounter.service.js";
import {
  raidBossFightDurationInputSchema,
  raidBossPhaseMarkerIdSchema,
  raidBossPhaseMarkerInputSchema,
  raidCooldownBossIdSchema
} from "./cooldown.validation.js";

export class RaidCooldownEncounterController {
  constructor(
    private readonly service:
      RaidCooldownEncounterService
  ) {}

  updateFightDuration: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const input =
      raidBossFightDurationInputSchema.parse(
        request.body
      );

    const boss =
      await this.service.updateFightDuration(
        bossId,
        input
      );

    response.json(boss);
  };

  listPhaseMarkers: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const markers =
      await this.service.listPhaseMarkers(
        bossId
      );

    response.json({
      items: markers,
      total: markers.length
    });
  };

  createPhaseMarker: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const input =
      raidBossPhaseMarkerInputSchema.parse(
        request.body
      );

    const marker =
      await this.service.createPhaseMarker(
        bossId,
        input
      );

    response
      .status(201)
      .json(marker);
  };

  deletePhaseMarker: RequestHandler = async (
    request,
    response
  ) => {
    const markerId =
      raidBossPhaseMarkerIdSchema.parse(
        request.params.markerId
      );

    await this.service.deletePhaseMarker(
      markerId
    );

    response.status(204).send();
  };

  listAbilityCasts: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const casts =
      await this.service.listAbilityCasts(
        bossId
      );

    response.json({
      items: casts,
      total: casts.length
    });
  };

  syncBossFromWarcraftLogs: RequestHandler = async (
    request,
    response
  ) => {
    const bossId =
      raidCooldownBossIdSchema.parse(
        request.params.bossId
      );

    const result =
      await this.service.syncBossFromWarcraftLogs(
        bossId
      );

    response.json(result);
  };
}
