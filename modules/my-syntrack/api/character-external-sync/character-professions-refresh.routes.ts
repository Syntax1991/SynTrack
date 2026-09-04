import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { CharacterEquipmentRefreshRepository } from "./character-equipment-refresh.repository.js";
import { CharacterProfessionRefreshService } from "./character-profession-refresh.service.js";
import { CharacterProfessionsRefreshController } from "./character-professions-refresh.controller.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";

const appTokenService = new BattleNetAppTokenService();
const battleNetClient = new BattleNetClient();
const snapshotRepository = new CharacterExternalSnapshotRepository();
const characterLookup = new CharacterEquipmentRefreshRepository();

const service = new CharacterProfessionRefreshService(
  appTokenService,
  battleNetClient,
  snapshotRepository,
  characterLookup
);

const controller = new CharacterProfessionsRefreshController(service);

export const characterProfessionsRefreshRouter = Router();

characterProfessionsRefreshRouter.post(
  "/:characterId/refresh-professions",
  asyncHandler(controller.refreshOne)
);

characterProfessionsRefreshRouter.post(
  "/refresh-all-professions",
  asyncHandler(controller.refreshAll)
);
