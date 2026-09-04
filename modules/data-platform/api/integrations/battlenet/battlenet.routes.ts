import { Router } from "express";
import { asyncHandler } from "../../../../../apps/api/src/shared/http/asyncHandler.js";
import { CharacterRepository } from "../../../../my-syntrack/api/characters/character.repository.js";
import { CharacterEquipmentRefreshRepository } from "../../../../my-syntrack/api/character-external-sync/character-equipment-refresh.repository.js";
import { CharacterExternalSnapshotRepository } from "../../../../my-syntrack/api/character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfileRefreshService } from "../../../../my-syntrack/api/character-external-sync/character-profile-refresh.service.js";
import { ProfessionRepository } from "../../../../professions/api/profession.repository.js";
import { raiderAuthService } from "../../raider-auth/raider-auth.routes.js";
import { BattleNetAppTokenService } from "./battlenet-app-token.service.js";
import { BattleNetClient } from "./battlenet.client.js";
import { BattleNetController } from "./battlenet.controller.js";
import { BattleNetImportService } from "./battlenet-import.service.js";
import { BattleNetService } from "./battlenet.service.js";

const client =
  new BattleNetClient();

const characterRepository =
  new CharacterRepository();

const professionRepository =
  new ProfessionRepository();

const appTokenService =
  new BattleNetAppTokenService();

const profileRefreshService =
  new CharacterProfileRefreshService(
    appTokenService,
    client,
    new CharacterExternalSnapshotRepository(),
    new CharacterEquipmentRefreshRepository()
  );

const importService =
  new BattleNetImportService(
    client,
    characterRepository,
    professionRepository,
    raiderAuthService,
    appTokenService,
    profileRefreshService
  );

const service =
  new BattleNetService(
    importService
  );

const controller =
  new BattleNetController(
    service
  );

export const battleNetIntegrationRouter =
  Router();

battleNetIntegrationRouter.get(
  "/characters",
  asyncHandler(
    controller.listCharacters
  )
);

battleNetIntegrationRouter.post(
  "/import",
  asyncHandler(
    controller.importCharacters
  )
);
