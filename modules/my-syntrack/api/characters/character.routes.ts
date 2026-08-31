import { Router } from "express";
import { asyncHandler } from "../../../../apps/api/src/shared/http/asyncHandler.js";
import { ProfessionRepository } from "../../../professions/api/profession.repository.js";
import { raiderAuthService } from "../../../data-platform/api/raider-auth/raider-auth.routes.js";
import { CharacterController } from "./character.controller.js";
import { CharacterRepository } from "./character.repository.js";
import { CharacterService } from "./character.service.js";

const characterRepository = new CharacterRepository();
const professionRepository = new ProfessionRepository();

const service = new CharacterService(
  characterRepository,
  professionRepository
);

const controller = new CharacterController(service, raiderAuthService);

export const characterRouter = Router();

characterRouter.get("/", asyncHandler(controller.list));

characterRouter.get("/removed", asyncHandler(controller.listRemoved));

characterRouter.post(
  "/removed/:removedId/restore",
  asyncHandler(controller.restore)
);

characterRouter.post("/", asyncHandler(controller.create));

characterRouter.put("/:characterId", asyncHandler(controller.update));

characterRouter.delete("/:characterId", asyncHandler(controller.remove));
