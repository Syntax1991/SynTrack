import type { RequestHandler } from "express";
import { TagService } from "./tag.service.js";
import {
  characterIdParamSchema,
  tagCreateSchema,
  tagIdParamSchema,
  tagUpdateSchema
} from "./tag.validation.js";

export class TagController {
  constructor(
    private readonly service: TagService
  ) {}

  list: RequestHandler = async (
    _request,
    response
  ) => {
    response.json({
      items: await this.service.list()
    });
  };

  create: RequestHandler = async (
    request,
    response
  ) => {
    const input = tagCreateSchema.parse(
      request.body
    );

    response.json(
      await this.service.create(input)
    );
  };

  update: RequestHandler = async (
    request,
    response
  ) => {
    const id = tagIdParamSchema.parse(
      request.params.id
    );

    const update = tagUpdateSchema.parse(
      request.body
    );

    response.json(
      await this.service.update(
        id,
        update
      )
    );
  };

  delete: RequestHandler = async (
    request,
    response
  ) => {
    const id = tagIdParamSchema.parse(
      request.params.id
    );

    await this.service.delete(id);

    response.status(204).send();
  };

  assign: RequestHandler = async (
    request,
    response
  ) => {
    const tagId = tagIdParamSchema.parse(
      request.params.tagId
    );

    const characterId =
      characterIdParamSchema.parse(
        request.params.characterId
      );

    await this.service.assign(
      characterId,
      tagId
    );

    response.status(204).send();
  };

  unassign: RequestHandler = async (
    request,
    response
  ) => {
    const tagId = tagIdParamSchema.parse(
      request.params.tagId
    );

    const characterId =
      characterIdParamSchema.parse(
        request.params.characterId
      );

    await this.service.unassign(
      characterId,
      tagId
    );

    response.status(204).send();
  };

  listAssignments: RequestHandler = async (
    _request,
    response
  ) => {
    response.json({
      items:
        await this.service.listAllAssignments()
    });
  };
}
