import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { guildRaiderLinkService } from "../../../guild/api/raider-link/raider-link.routes.js";
import { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import { guildVerificationService } from "../../../guild/api/verification/verification.routes.js";
import { RaidSetupRepository } from "../setups/setup.repository.js";
import { RaidBossCatalogController } from "./boss-catalog.controller.js";
import { RaidBossCatalogService } from "./boss-catalog.service.js";
import { RaidBossRosterController } from "./boss-roster.controller.js";
import { RaidBossRosterRepository } from "./boss-roster.repository.js";
import { RaidBossRosterService } from "./boss-roster.service.js";

const repository =
  new RaidBossRosterRepository();

const rosterRepository =
  new GuildRosterRepository();

const setupRepository =
  new RaidSetupRepository();

const service =
  new RaidBossRosterService(
    repository,
    rosterRepository,
    setupRepository,
    guildVerificationService,
    guildRaiderLinkService
  );

const controller =
  new RaidBossRosterController(
    service
  );

const catalogService =
  new RaidBossCatalogService(
    repository,
    guildVerificationService
  );

const catalogController =
  new RaidBossCatalogController(
    catalogService
  );

export const raidBossRosterRouter =
  Router();

raidBossRosterRouter.get(
  "/setups/:setupId",
  asyncHandler(
    controller.listForSetup
  )
);

raidBossRosterRouter.post(
  "/events/:eventId/bosses",
  asyncHandler(
    catalogController.createBoss
  )
);

raidBossRosterRouter.put(
  "/bosses/:bossId",
  asyncHandler(
    catalogController.updateBoss
  )
);

raidBossRosterRouter.delete(
  "/bosses/:bossId",
  asyncHandler(
    catalogController.deleteBoss
  )
);

raidBossRosterRouter.put(
  "/setups/:setupId/bosses/:bossId/members/:memberId",
  asyncHandler(
    controller.setEntry
  )
);

raidBossRosterRouter.delete(
  "/setups/:setupId/bosses/:bossId/members/:memberId",
  asyncHandler(
    controller.clearEntry
  )
);

raidBossRosterRouter.put(
  "/setups/:setupId/bosses/:bossId/members/:memberId/spec",
  asyncHandler(
    controller.setSpec
  )
);
