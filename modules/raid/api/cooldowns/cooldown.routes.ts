import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { guildVerificationService } from "../../../guild/api/verification/verification.routes.js";
import { RaidSetupRepository } from "../setups/setup.repository.js";
import { RaidCooldownController } from "./cooldown.controller.js";
import { RaidCooldownRepository } from "./cooldown.repository.js";
import { RaidCooldownService } from "./cooldown.service.js";
import { RaidCooldownEncounterController } from "./cooldownEncounter.controller.js";
import { RaidCooldownEncounterService } from "./cooldownEncounter.service.js";
import { WarcraftLogsClient } from "./warcraftlogs.client.js";

const repository =
  new RaidCooldownRepository();

const setupRepository =
  new RaidSetupRepository();

const warcraftLogsClient =
  new WarcraftLogsClient();

const service = new RaidCooldownService(
  repository,
  setupRepository,
  guildVerificationService
);

const controller =
  new RaidCooldownController(service);

const encounterService =
  new RaidCooldownEncounterService(
    repository,
    guildVerificationService,
    warcraftLogsClient
  );

const encounterController =
  new RaidCooldownEncounterController(
    encounterService
  );

export const raidCooldownRouter =
  Router();

// Planning data (plan participants, assignments) is Setup+Boss
// scoped — the same Boss can have a different Cooldown Plan under a
// different Setup for the same event. There is deliberately no
// boss-only route for any of these; that would let a caller bypass
// the Setup scope entirely.
raidCooldownRouter.get(
  "/setups/:setupId",
  asyncHandler(
    controller.listForSetup
  )
);

raidCooldownRouter.post(
  "/setups/:setupId/bosses/:bossId",
  asyncHandler(
    controller.createAssignment
  )
);

raidCooldownRouter.put(
  "/setups/:setupId/bosses/:bossId/:assignmentId",
  asyncHandler(
    controller.updateAssignment
  )
);

raidCooldownRouter.delete(
  "/setups/:setupId/bosses/:bossId/:assignmentId",
  asyncHandler(
    controller.deleteAssignment
  )
);

raidCooldownRouter.get(
  "/setups/:setupId/bosses/:bossId/plan-members",
  asyncHandler(
    controller.listPlanMembers
  )
);

raidCooldownRouter.post(
  "/setups/:setupId/bosses/:bossId/plan-members",
  asyncHandler(
    controller.addPlanMember
  )
);

raidCooldownRouter.delete(
  "/setups/:setupId/bosses/:bossId/plan-members/:memberId",
  asyncHandler(
    controller.removePlanMember
  )
);

// Encounter facts (WCL casts, phases, fight duration) describe the
// fight itself, not any particular composition — these stay boss-only
// regardless of Setup.
raidCooldownRouter.put(
  "/bosses/:bossId/duration",
  asyncHandler(
    encounterController.updateFightDuration
  )
);

raidCooldownRouter.get(
  "/bosses/:bossId/phase-markers",
  asyncHandler(
    encounterController.listPhaseMarkers
  )
);

raidCooldownRouter.post(
  "/bosses/:bossId/phase-markers",
  asyncHandler(
    encounterController.createPhaseMarker
  )
);

raidCooldownRouter.delete(
  "/phase-markers/:markerId",
  asyncHandler(
    encounterController.deletePhaseMarker
  )
);

raidCooldownRouter.get(
  "/bosses/:bossId/ability-casts",
  asyncHandler(
    encounterController.listAbilityCasts
  )
);

raidCooldownRouter.post(
  "/bosses/:bossId/sync-wcl",
  asyncHandler(
    encounterController.syncBossFromWarcraftLogs
  )
);
