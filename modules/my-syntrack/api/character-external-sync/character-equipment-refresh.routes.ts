import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { CharacterEquipmentRefreshController } from "./character-equipment-refresh.controller.js";
import { CharacterEquipmentRefreshRepository } from "./character-equipment-refresh.repository.js";
import { CharacterEquipmentRefreshService } from "./character-equipment-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";

const appTokenService = new BattleNetAppTokenService();
const battleNetClient = new BattleNetClient();
const snapshotRepository = new CharacterExternalSnapshotRepository();
const characterLookup = new CharacterEquipmentRefreshRepository();

const service = new CharacterEquipmentRefreshService(
  appTokenService,
  battleNetClient,
  snapshotRepository,
  characterLookup
);

const controller = new CharacterEquipmentRefreshController(service);

export const characterEquipmentRefreshRouter = Router();

characterEquipmentRefreshRouter.post(
  "/:characterId/refresh",
  asyncHandler(controller.refreshOne)
);

characterEquipmentRefreshRouter.post(
  "/refresh-all",
  asyncHandler(controller.refreshAll)
);
