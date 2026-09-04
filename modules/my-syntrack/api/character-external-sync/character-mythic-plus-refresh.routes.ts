import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { CharacterEquipmentRefreshRepository } from "./character-equipment-refresh.repository.js";
import { CharacterMythicPlusRefreshService } from "./character-mythic-plus-refresh.service.js";
import { CharacterMythicPlusRefreshController } from "./character-mythic-plus-refresh.controller.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";

const appTokenService = new BattleNetAppTokenService();
const battleNetClient = new BattleNetClient();
const snapshotRepository = new CharacterExternalSnapshotRepository();
const characterLookup = new CharacterEquipmentRefreshRepository();

const service = new CharacterMythicPlusRefreshService(
  appTokenService,
  battleNetClient,
  snapshotRepository,
  characterLookup
);

const controller = new CharacterMythicPlusRefreshController(service, raiderAuthService);

export const characterMythicPlusRefreshRouter = Router();

characterMythicPlusRefreshRouter.post(
  "/:characterId/refresh-mythic-plus",
  asyncHandler(controller.refreshOne)
);

characterMythicPlusRefreshRouter.post(
  "/refresh-all-mythic-plus",
  asyncHandler(controller.refreshAll)
);
