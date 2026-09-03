import type { Request, Response } from "express";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { isWeeklyGameplayEnabled } from "../character-tracking/domain-applicability.js";
import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import { TagRepository } from "../tags/tag.repository.js";
import { TagService } from "../tags/tag.service.js";
import { buildTagsByCharacterId } from "../overview/overview-character-extras.js";
import type { SeasonGoalPreferenceService } from "./season-goal-preference.service.js";
import type { SeasonGoalPreferenceInput } from "./season-goal-preference.types.js";

export class SeasonGoalPreferenceController {
  private readonly characterRepository = new WeeklyChecklistRepository();

  private readonly tagService = new TagService(new TagRepository());

  constructor(private readonly service: SeasonGoalPreferenceService) {}

  private async gameplayCharacters() {
    const [characters, tags, tagAssignments] = await Promise.all([
      this.characterRepository.findCharactersForSeason(),
      this.tagService.list(),
      this.tagService.listAllAssignments()
    ]);

    const tagsByCharacterId = buildTagsByCharacterId(tags, tagAssignments);

    // Only gameplay-applicable Characters get Character Season goal
    // configuration — profession-only Characters must not suddenly gain
    // gameplay goals.
    return characters.filter((character) =>
      isWeeklyGameplayEnabled(
        resolveCharacterTrackingProfile(
          tagsByCharacterId.get(character.id) ?? []
        )
      )
    );
  }

  getManageGoalsView = async (_request: Request, response: Response) => {
    const characters = await this.gameplayCharacters();
    const view = await this.service.getManageGoalsView(characters);
    response.json(view);
  };

  savePreference = async (request: Request, response: Response) => {
    const body = request.body as Partial<SeasonGoalPreferenceInput>;

    if (typeof body.goalKey !== "string") {
      throw new AppError(400, "goalKey is required");
    }

    if (typeof body.enabled !== "boolean") {
      throw new AppError(400, "enabled is required");
    }

    const input: SeasonGoalPreferenceInput = {
      goalKey: body.goalKey,
      characterId:
        typeof body.characterId === "string" ? body.characterId : null,
      enabled: body.enabled,
      numericTarget:
        typeof body.numericTarget === "number" ? body.numericTarget : null,
      enumTarget: typeof body.enumTarget === "string" ? body.enumTarget : null
    };

    const value = await this.service.savePreference(input);
    response.json(value);
  };

  resetPreference = async (request: Request, response: Response) => {
    const goalKey = request.query.goalKey;
    const characterId = request.query.characterId;

    if (typeof goalKey !== "string") {
      throw new AppError(400, "goalKey is required");
    }

    const value = await this.service.resetPreference(
      goalKey,
      typeof characterId === "string" ? characterId : null
    );

    response.json(value);
  };
}
