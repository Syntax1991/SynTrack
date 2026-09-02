import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  blockedCharacterSeasonGoalGaps,
  enabledCharacterSeasonGoals,
  enabledWarbandSeasonGoals,
  MIDNIGHT_S2_SEASON_GOAL_CATALOG
} from "./season-goal-catalog.js";
import { summarizeSeasonGoals } from "./season-checklist.goals.js";
import type { SeasonChecklistResponse } from "./season-checklist.types.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("season temporal boundary", () => {
  it("does not depend on weekly profession state for the Character matrix", () => {
    const serviceSource = readFileSync(
      join(here, "season-checklist.service.ts"),
      "utf8"
    );

    expect(serviceSource).not.toMatch(/ProfessionWeeklyStatus/);
    expect(serviceSource).not.toMatch(
      /resolveWeekliesProfessionWeeklySummary/
    );
    expect(serviceSource).not.toMatch(/getWeeklyPeriod/);
    expect(serviceSource).toMatch(/findCharactersForSeason/);
    expect(serviceSource).toMatch(/activeCharacters/);
    expect(serviceSource).toMatch(
      /gameplayCharacters = activeCharacters\.filter/
    );
  });

  it("response shape excludes weekly profession summary and pending-capture counts", () => {
    const response: SeasonChecklistResponse = {
      season: { key: "MIDNIGHT-S2", name: "Midnight Season 2" },
      characters: [
        {
          id: "c1",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80,
          trackingProfile: "FULL",
          mythicPlus: {
            key: "rating-2000",
            title: "Mythic+ rating",
            state: "INCOMPLETE",
            label: "1847 → 2K",
            detail: "score",
            actionLabel: "Reach 2K Mythic+ rating"
          },
          portals: {
            key: "portals",
            title: "Portals",
            state: "UNKNOWN",
            label: "?",
            detail: "Portals",
            actionLabel: null
          },
          catalyst: {
            key: "serpent-scion",
            title: "Catalyst",
            state: "UNKNOWN",
            label: "?",
            detail: "Catalyst",
            actionLabel: null
          },
          cracked: {
            key: "cracked-keystone",
            title: "Cracked",
            state: "UNKNOWN",
            label: "?",
            detail: "Cracked",
            actionLabel: null
          },
          nemesis: {
            key: "nemesis-aztarec",
            title: "Nemesis",
            state: "UNKNOWN",
            label: "?",
            detail: "Nemesis",
            actionLabel: null
          },
          raid: {
            key: "raid",
            title: "Raid",
            state: "UNKNOWN",
            label: "?",
            detail: "Raid",
            actionLabel: null
          },
          goalsOpen: 1,
          goalsComplete: 0,
          goalsUnknown: 0,
          action: "Reach 2K Mythic+ rating"
        }
      ],
      warbandGoals: [],
      summary: {
        characterCount: 1,
        goalsOpen: 1,
        goalsComplete: 0,
        goalsUnknown: 0
      }
    };

    expect(response).not.toHaveProperty("blockedCharacterGoals");
    expect(response.summary).not.toHaveProperty("warbandGoalsPending");
    expect(response.characters[0]).not.toHaveProperty(
      "professionWeeklySummary"
    );
    expect(JSON.stringify(response)).not.toMatch(/capture pending/i);
  });

  it("summary counts only active tracked goals, never disabled catalog entries", () => {
    const enabled = enabledCharacterSeasonGoals();
    const disabledCount = MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter(
      (goal) => !goal.enabled
    ).length;

    expect(enabled).toHaveLength(7);
    expect(disabledCount).toBeGreaterThan(0);
    expect(enabledWarbandSeasonGoals()).toHaveLength(1);

    // Only the live M+ goal contributes; disabled Cracked/etc. do not.
    const summary = summarizeSeasonGoals([
      {
        key: "rating-2000",
        title: "M+",
        state: "INCOMPLETE",
        label: "1847 → 2K",
        detail: "open",
        actionLabel: "Reach 2K Mythic+ rating"
      }
    ]);

    expect(summary.goalsOpen).toBe(1);
    expect(summary.goalsComplete).toBe(0);
    expect(summary.goalsUnknown).toBe(0);
    expect(
      blockedCharacterSeasonGoalGaps().some(
        (goal) => goal.key === "nemesis-aztarec-solo"
      )
    ).toBe(true);
  });

  it("M+ seasonal goal is independent of profession weekly open counts", () => {
    const withProfessionNoise = summarizeSeasonGoals([
      {
        key: "rating-2000",
        title: "M+",
        state: "COMPLETE",
        label: "✓ 2K",
        detail: "done",
        actionLabel: null
      }
    ]);

    // Profession weekly state is not a Season goal input at all.
    expect(withProfessionNoise).toEqual({
      goalsOpen: 0,
      goalsComplete: 1,
      goalsUnknown: 0,
      action: null
    });
  });
});
