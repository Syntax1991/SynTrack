import type { Request, Response } from "express";
import type { SeasonChecklistService } from "./season-checklist.service.js";

export class SeasonChecklistController {
  constructor(private readonly service: SeasonChecklistService) {}

  getChecklist = async (_request: Request, response: Response) => {
    const checklist = await this.service.getChecklist();
    response.json(checklist);
  };
}
