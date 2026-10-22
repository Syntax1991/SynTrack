import type { Request, RequestHandler } from "express";
import { requireBearerToken } from "../../../../apps/api/src/shared/http/bearerToken.js";
import type { RaiderSessionGuard } from "../../../data-platform/api/raider-auth/raider-auth.types.js";
import type { BonusRollCatalogService } from "./bonus-roll-catalog.service.js";
import type { BonusRollService } from "./bonus-roll.service.js";
import {
  bonusRollCreateSchema,
  bonusRollIdParamSchema,
  bonusRollResultSchema,
  bonusRollUpdateSchema,
  journalIdParamSchema
} from "./bonus-roll.validation.js";

/*
 * Every Bonus Roll endpoint - reads included - requires a signed-in
 * SynTrack session; the planner is not public.
 */
export class BonusRollController {
  constructor(
    private readonly service: BonusRollService,
    private readonly catalog: BonusRollCatalogService,
    private readonly raiderAuth: RaiderSessionGuard
  ) {}

  list: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const items = await this.service.list();

    response.json({ items, total: items.length });
  };

  create: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const input = bonusRollCreateSchema.parse(request.body);

    response.status(201).json(await this.service.create(input));
  };

  update: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const id = bonusRollIdParamSchema.parse(request.params.id);
    const input = bonusRollUpdateSchema.parse(request.body);

    response.json(await this.service.update(id, input));
  };

  recordResult: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const id = bonusRollIdParamSchema.parse(request.params.id);
    const input = bonusRollResultSchema.parse(request.body);

    response.json(await this.service.recordResult(id, input));
  };

  clearResult: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const id = bonusRollIdParamSchema.parse(request.params.id);

    response.json(await this.service.clearResult(id));
  };

  delete: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const id = bonusRollIdParamSchema.parse(request.params.id);

    await this.service.delete(id);
    response.status(204).send();
  };

  listInstances: RequestHandler = async (request, response) => {
    await this.requireSession(request);

    response.json({ items: await this.catalog.listInstances() });
  };

  listEncounters: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const instanceId = journalIdParamSchema.parse(request.params.instanceId);

    response.json({ items: await this.catalog.listEncounters(instanceId) });
  };

  listLoot: RequestHandler = async (request, response) => {
    await this.requireSession(request);
    const instanceId = journalIdParamSchema.parse(request.params.instanceId);
    const encounterId = journalIdParamSchema.parse(request.params.encounterId);

    response.json({ items: await this.catalog.listLoot(instanceId, encounterId) });
  };

  private async requireSession(request: Request): Promise<void> {
    await this.raiderAuth.requireSession(requireBearerToken(request));
  }
}
