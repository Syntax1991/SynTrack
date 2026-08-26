import type { RequestHandler } from "express";
import { TrackerValueService } from "./tracker-value.service.js";
import {
  trackerCharacterIdRouteParamSchema,
  trackerDefinitionIdRouteParamSchema,
  trackerScopeQuerySchema,
  trackerValueSetSchema
} from "./tracker-value.validation.js";

export class TrackerValueController {
  constructor(
    private readonly service:
      TrackerValueService
  ) {}

  getStatesForScope: RequestHandler = async (
    request,
    response
  ) => {
    const query =
      trackerScopeQuerySchema.parse(
        request.query
      );

    response.json(
      await this.service.getStatesForScope(
        query.scopeKey,
        query.characterIds,
        query.period
      )
    );
  };

  setValue: RequestHandler = async (
    request,
    response
  ) => {
    const trackerDefinitionId =
      trackerDefinitionIdRouteParamSchema.parse(
        request.params
          .trackerDefinitionId
      );

    const characterId =
      trackerCharacterIdRouteParamSchema.parse(
        request.params.characterId
      );

    const input =
      trackerValueSetSchema.parse(
        request.body
      );

    response.json(
      await this.service.setValue(
        trackerDefinitionId,
        characterId,
        input
      )
    );
  };

  clearValue: RequestHandler = async (
    request,
    response
  ) => {
    const trackerDefinitionId =
      trackerDefinitionIdRouteParamSchema.parse(
        request.params
          .trackerDefinitionId
      );

    const characterId =
      trackerCharacterIdRouteParamSchema.parse(
        request.params.characterId
      );

    response.json(
      await this.service.clearValue(
        trackerDefinitionId,
        characterId
      )
    );
  };
}
