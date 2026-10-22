import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetJournalService } from "../../../data-platform/api/integrations/battlenet/battlenet-journal.service.js";
import { BonusRollCatalogService } from "./bonus-roll-catalog.service.js";
import { BonusRollController } from "./bonus-roll.controller.js";
import { BonusRollRepository } from "./bonus-roll.repository.js";
import { BonusRollService } from "./bonus-roll.service.js";

const catalog = new BonusRollCatalogService(
  new BattleNetJournalService(new BattleNetAppTokenService())
);
const service = new BonusRollService(new BonusRollRepository(), catalog);
const controller = new BonusRollController(service, catalog, raiderAuthService);

export const bonusRollRouter = Router();

bonusRollRouter.get("/catalog/instances", asyncHandler(controller.listInstances));
bonusRollRouter.get("/catalog/instances/:instanceId/encounters", asyncHandler(controller.listEncounters));
bonusRollRouter.get(
  "/catalog/instances/:instanceId/encounters/:encounterId/loot",
  asyncHandler(controller.listLoot)
);

bonusRollRouter.get("/", asyncHandler(controller.list));
bonusRollRouter.post("/", asyncHandler(controller.create));
bonusRollRouter.put("/:id", asyncHandler(controller.update));
bonusRollRouter.put("/:id/result", asyncHandler(controller.recordResult));
bonusRollRouter.delete("/:id/result", asyncHandler(controller.clearResult));
bonusRollRouter.delete("/:id", asyncHandler(controller.delete));
