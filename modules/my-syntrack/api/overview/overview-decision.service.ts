import { SeasonChecklistService } from "../season-checklist/season-checklist.service.js";
import { ProfessionOverviewWorkService } from "../profession-overview/profession-overview-work.service.js";
import { WeeklyChecklistRepository } from "../weekly-checklist/weekly-checklist.repository.js";
import { WeeklyChecklistService } from "../weekly-checklist/weekly-checklist.service.js";
import {
  buildOverviewDecisionResponse
} from "./overview-decision.compose.js";
import type {
  OverviewActionCandidate,
  OverviewDecisionResponse
} from "./overview-decision.types.js";
import { deriveWeekliesGameplayAction } from "./overview-decision.weeklies.js";

const WEEKLIES_PATH = "/weekly-checklist";
const SEASON_PATH = "/season";
const PROFESSIONS_PATH = "/professions";

/** Gameplay Weeklies before profession weekly within WEEKLY horizon. */
const LOCAL_WEEKLIES_GAMEPLAY = 0;
const LOCAL_PROFESSION_WEEKLY = 1;
const LOCAL_SEASON = 0;
const LOCAL_PROFESSION_PERMANENT = 0;

function isProfessionActionable(nextAction: string | null): nextAction is string {
  return nextAction !== null && nextAction !== "Weekly complete";
}

function professionActionLabel(
  professionName: string,
  nextAction: string
): string {
  return `${professionName}: ${nextAction}`;
}

/**
 * Account-wide Overview Decision Engine V1.
 * Composes Weeklies / Season / Profession work actions — no duplicate truth.
 */
export class OverviewDecisionService {
  constructor(
    private readonly weeklyChecklistService = new WeeklyChecklistService(
      new WeeklyChecklistRepository()
    ),
    private readonly seasonChecklistService = new SeasonChecklistService(),
    private readonly professionOverviewWorkService =
      new ProfessionOverviewWorkService()
  ) {}

  async getOverview(): Promise<OverviewDecisionResponse> {
    const [weeklies, season, professions] = await Promise.all([
      this.weeklyChecklistService.getChecklist(),
      this.seasonChecklistService.getChecklist(),
      this.professionOverviewWorkService.getOverview()
    ]);

    const actions: OverviewActionCandidate[] = [];
    let weeklyCharactersWithWork = 0;

    for (const character of weeklies.characters) {
      const action = deriveWeekliesGameplayAction({
        trackingProfile: character.trackingProfile,
        weeklyGameplay: character.weeklyGameplay,
        gameplaySignals: character.gameplaySignals
      });

      if (!action) {
        continue;
      }

      weeklyCharactersWithWork += 1;
      actions.push({
        characterId: character.id,
        characterName: character.name,
        className: character.className,
        source: "WEEKLIES",
        horizon: "WEEKLY",
        action,
        path: WEEKLIES_PATH,
        localOrder: LOCAL_WEEKLIES_GAMEPLAY
      });
    }

    let seasonOpen = 0;
    let seasonUnknown = 0;

    for (const character of season.characters) {
      seasonOpen += character.goalsOpen;
      seasonUnknown += character.goalsUnknown;

      if (character.goalsOpen > 0 && character.action) {
        actions.push({
          characterId: character.id,
          characterName: character.name,
          className: character.className,
          source: "SEASON",
          horizon: "SEASONAL",
          action: character.action,
          path: SEASON_PATH,
          localOrder: LOCAL_SEASON
        });
      }
    }

    let professionWeeklyActions = 0;
    let professionPermanentAttention = 0;
    let professionUnresolved = 0;

    for (const row of professions.rows) {
      if (row.weekly.state === "UNKNOWN" || row.treasures.state === "UNKNOWN") {
        professionUnresolved += 1;
      }

      if (row.attention.weekly && isProfessionActionable(row.nextAction)) {
        professionWeeklyActions += 1;
        actions.push({
          characterId: row.character.id,
          characterName: row.character.name,
          className: row.character.className,
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: professionActionLabel(
            row.profession.name,
            row.nextAction
          ),
          path: PROFESSIONS_PATH,
          localOrder: LOCAL_PROFESSION_WEEKLY
        });
        continue;
      }

      if (
        row.attention.permanent &&
        isProfessionActionable(row.nextAction)
      ) {
        professionPermanentAttention += 1;
        actions.push({
          characterId: row.character.id,
          characterName: row.character.name,
          className: row.character.className,
          source: "PROFESSIONS",
          horizon: "PERMANENT",
          action: professionActionLabel(
            row.profession.name,
            row.nextAction
          ),
          path: PROFESSIONS_PATH,
          localOrder: LOCAL_PROFESSION_PERMANENT
        });
      }
    }

    return buildOverviewDecisionResponse({
      summaries: {
        weekly: {
          charactersWithWork: weeklyCharactersWithWork
        },
        season: {
          open: seasonOpen,
          unknown: seasonUnknown
        },
        professions: {
          weeklyActions: professionWeeklyActions,
          permanentAttention: professionPermanentAttention
        },
        unresolved: seasonUnknown + professionUnresolved
      },
      actions
    });
  }
}
