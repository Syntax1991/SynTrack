import type {
  RequestHandler
} from "express";
import { characterIdSchema } from "../characters/character.validation.js";
import { OverviewService } from "./overview.service.js";

export class OverviewController {
  constructor(
    private readonly service:
      OverviewService
  ) {}

  getOverview: RequestHandler = async (
    _request,
    response
  ) => {
    response.json(
      await this.service.getOverview()
    );
  };

  getCharacterState: RequestHandler = async (
    request,
    response
  ) => {
    const characterId =
      characterIdSchema.parse(
        request.params.characterId
      );

    response.json(
      await this.service.getCharacterState(
        characterId
      )
    );
  };
}
