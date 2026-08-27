import type { RequestHandler } from "express";
import { TrackerScopeProfileService } from "./tracker-scope-profile.service.js";
import {
  trackerScopeProfileCreateSchema,
  trackerScopeProfileKeyParamSchema
} from "./tracker-scope-profile.validation.js";

export class TrackerScopeProfileController {
  constructor(
    private readonly service: TrackerScopeProfileService
  ) {}

  list: RequestHandler = async (
    _request,
    response
  ) => {
    response.json({
      items: await this.service.list()
    });
  };

  getActive: RequestHandler = async (
    _request,
    response
  ) => {
    response.json(
      await this.service.getActive()
    );
  };

  create: RequestHandler = async (
    request,
    response
  ) => {
    const input =
      trackerScopeProfileCreateSchema.parse(
        request.body
      );

    response.json(
      await this.service.create(input)
    );
  };

  setActive: RequestHandler = async (
    request,
    response
  ) => {
    const key =
      trackerScopeProfileKeyParamSchema.parse(
        request.params.key
      );

    response.json(
      await this.service.setActive(
        key
      )
    );
  };
}
