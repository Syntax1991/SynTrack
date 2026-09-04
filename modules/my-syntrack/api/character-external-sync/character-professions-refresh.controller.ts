import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { characterIdSchema } from "../characters/character.validation.js";
import type { CharacterProfessionRefreshService } from "./character-profession-refresh.service.js";

export class CharacterProfessionsRefreshController {
  constructor(
    private readonly service: CharacterProfessionRefreshService
  ) {}

  refreshOne: RequestHandler = async (request, response) => {
    const characterId = characterIdSchema.parse(request.params.characterId);

    const outcome = await this.service.refreshCharacter(characterId);

    if (outcome.status === "NOT_FOUND") {
      throw new AppError(404, "Character not found.");
    }

    response.json(outcome);
  };

  refreshAll: RequestHandler = async (_request, response) => {
    response.json(await this.service.refreshAllEligible());
  };
}
