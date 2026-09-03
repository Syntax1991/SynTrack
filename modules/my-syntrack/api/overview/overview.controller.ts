import type { RequestHandler } from "express";
import { characterIdSchema } from "../characters/character.validation.js";
import { OverviewDecisionService } from "./overview-decision.service.js";
import { OverviewService } from "./overview.service.js";

export class OverviewController {
  constructor(
    private readonly decisionService = new OverviewDecisionService(),
    private readonly characterOverviewService = new OverviewService()
  ) {}

  getOverview: RequestHandler = async (_request, response) => {
    response.json(await this.decisionService.getOverview());
  };

  getCharacterState: RequestHandler = async (request, response) => {
    const characterId = characterIdSchema.parse(
      request.params.characterId
    );

    response.json(
      await this.characterOverviewService.getCharacterState(
        characterId
      )
    );
  };
}
