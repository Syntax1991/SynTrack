import type { RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import { CharacterService } from "./character.service.js";
import {
  characterIdSchema,
  characterInputSchema
} from "./character.validation.js";

export class CharacterController {
  constructor(
    private readonly service: CharacterService,
    private readonly raiderAuth: RaiderSessionGuard
  ) {}

  list: RequestHandler = async (_request, response) => {
    const characters = await this.service.list();

    response.json({
      items: characters,
      total: characters.length
    });
  };

  listRemoved: RequestHandler = async (request, response) => {
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const items = await this.service.listRemoved(session.raiderAccountId);

    response.json({ items, total: items.length });
  };

  create: RequestHandler = async (request, response) => {
    const input = characterInputSchema.parse(request.body);
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);

    const character = await this.service.create(
      input,
      session.raiderAccountId
    );

    response.status(201).json(character);
  };

  update: RequestHandler = async (request, response) => {
    const characterId = characterIdSchema.parse(request.params.characterId);
    const input = characterInputSchema.parse(request.body);
    const character = await this.service.update(characterId, input);

    response.json(character);
  };

  remove: RequestHandler = async (request, response) => {
    const characterId = characterIdSchema.parse(request.params.characterId);
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);

    await this.service.remove(characterId, session.raiderAccountId);

    response.status(204).send();
  };

  restore: RequestHandler = async (request, response) => {
    const removedId = characterIdSchema.parse(request.params.removedId);
    const token = requireBearerToken(request);
    const session = await this.raiderAuth.requireSession(token);
    const result = await this.service.restore(
      removedId,
      session.raiderAccountId
    );

    response.json(result);
  };
}
