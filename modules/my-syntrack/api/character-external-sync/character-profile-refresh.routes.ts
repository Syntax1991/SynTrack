import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { CharacterEquipmentRefreshRepository } from "./character-equipment-refresh.repository.js";
import { CharacterProfileRefreshController } from "./character-profile-refresh.controller.js";
import { CharacterProfileRefreshService } from "./character-profile-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";

const appTokenService = new BattleNetAppTokenService();
const battleNetClient = new BattleNetClient();
const snapshotRepository = new CharacterExternalSnapshotRepository();
const characterLookup = new CharacterEquipmentRefreshRepository();

const service = new CharacterProfileRefreshService(
  appTokenService,
  battleNetClient,
  snapshotRepository,
  characterLookup
);

const controller = new CharacterProfileRefreshController(service, raiderAuthService);

export const characterProfileRefreshRouter = Router();

characterProfileRefreshRouter.post(
  "/:characterId/refresh-profile",
  asyncHandler(controller.refreshOne)
);

characterProfileRefreshRouter.post(
  "/refresh-all-profiles",
  asyncHandler(controller.refreshAll)
);
