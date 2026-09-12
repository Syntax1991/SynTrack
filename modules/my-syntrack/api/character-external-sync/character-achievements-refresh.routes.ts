import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { CharacterEquipmentRefreshRepository } from "./character-equipment-refresh.repository.js";
import { CharacterAchievementsRefreshService } from "./character-achievements-refresh.service.js";
import { CharacterAchievementsRefreshController } from "./character-achievements-refresh.controller.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";

const appTokenService = new BattleNetAppTokenService();
const battleNetClient = new BattleNetClient();
const snapshotRepository = new CharacterExternalSnapshotRepository();
const characterLookup = new CharacterEquipmentRefreshRepository();

const service = new CharacterAchievementsRefreshService(
  appTokenService,
  battleNetClient,
  snapshotRepository,
  characterLookup
);

const controller = new CharacterAchievementsRefreshController(service, raiderAuthService);

export const characterAchievementsRefreshRouter = Router();

characterAchievementsRefreshRouter.post(
  "/:characterId/refresh-achievements",
  asyncHandler(controller.refreshOne)
);

characterAchievementsRefreshRouter.post(
  "/refresh-all-achievements",
  asyncHandler(controller.refreshAll)
);
