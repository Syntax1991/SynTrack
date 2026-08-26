import type { RequestHandler } from "express";
import { TrackerDefinitionService } from "./tracker-definition.service.js";
import {
  trackerDefinitionCreateSchema,
  trackerDefinitionIdParamSchema,
  trackerDefinitionMetadataUpdateSchema,
  trackerScopeKeyParamSchema
} from "./tracker-definition.validation.js";

export class TrackerDefinitionController {
  constructor(
    private readonly service:
      TrackerDefinitionService
  ) {}

  listByScope: RequestHandler = async (
    request,
    response
  ) => {
    const scopeKey =
      trackerScopeKeyParamSchema.parse(
        request.params.scopeKey
      );

    response.json(
      await this.service.listByScope(
        scopeKey
      )
    );
  };

  create: RequestHandler = async (
    request,
    response
  ) => {
    const input =
      trackerDefinitionCreateSchema.parse(
        request.body
      );

    response.json(
      await this.service.create(input)
    );
  };

  updateMetadata: RequestHandler = async (
    request,
    response
  ) => {
    const id =
      trackerDefinitionIdParamSchema.parse(
        request.params.id
      );

    const update =
      trackerDefinitionMetadataUpdateSchema.parse(
        request.body
      );

    response.json(
      await this.service.updateMetadata(
        id,
        update
      )
    );
  };
}
