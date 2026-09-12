import type { RequestHandler } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import { characterIdSchema } from "../characters/character.validation.js";
import type { CharacterMythicPlusRefreshService } from "./character-mythic-plus-refresh.service.js";

export class CharacterMythicPlusRefreshController {
  constructor(
    private readonly service: CharacterMythicPlusRefreshService,
    private readonly raiderAuth: RaiderSessionGuard
  ) {}

  refreshOne: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    await this.raiderAuth.requireSession(token);

    const characterId = characterIdSchema.parse(request.params.characterId);

    const outcome = await this.service.refreshCharacter(characterId);

    if (outcome.status === "NOT_FOUND") {
      throw new AppError(404, "Character not found.");
    }

    response.json(outcome);
  };

  refreshAll: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    await this.raiderAuth.requireSession(token);

    response.json(await this.service.refreshAllEligible());
  };
}
