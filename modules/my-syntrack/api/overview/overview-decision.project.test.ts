import { describe, expect, it } from "vitest";
import {
  formatOverviewGameplayStatus,
  projectOverviewDecisionSurfaces,
  projectOverviewGameplayPriorities,
  projectOverviewProfessionWork,
  projectOverviewSetupAttention
} from "./overview-decision.project.js";
import type { OverviewActionCandidate } from "./overview-decision.types.js";

function candidate(
  overrides: Partial<OverviewActionCandidate> &
    Pick<
      OverviewActionCandidate,
      "action" | "horizon" | "source" | "characterId" | "characterName"
    >
): OverviewActionCandidate {
  return {
    className: overrides.className ?? "Shaman",
    path: overrides.path ?? "/season",
    localOrder: overrides.localOrder ?? 0,
    ...overrides
  };
}

describe("formatOverviewGameplayStatus", () => {
  it("formats open and unknown compactly", () => {
    expect(formatOverviewGameplayStatus(2, 1)).toBe("2 open · 1 unknown");
    expect(formatOverviewGameplayStatus(0, 1)).toBe("1 unknown");
    expect(formatOverviewGameplayStatus(4, 0)).toBe("4 open");
    expect(formatOverviewGameplayStatus(0, 0)).toBe("✓");
  });
});

describe("projectOverviewGameplayPriorities", () => {
  it("emits one gameplay row with weekly NEXT and season AFTER", () => {
    const rows = projectOverviewGameplayPriorities({
      gameplayCharacters: [
        {
          characterId: "c1",
          characterName: "Synblast",
          className: "Shaman"
        }
      ],
      actions: [
        candidate({
          characterId: "c1",
          characterName: "Synblast",
          source: "WEEKLIES",
          horizon: "WEEKLY",
          action: "2 more M+ runs for Vault slot 2",
          path: "/weekly-checklist",
          localOrder: 0
        }),
        candidate({
          characterId: "c1",
          characterName: "Synblast",
          source: "SEASON",
          horizon: "SEASONAL",
          action: "Complete 4pc tier set",
          path: "/season",
          localOrder: 0
        }),
        candidate({
          characterId: "c1",
          characterName: "Synblast",
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: "Leatherworking: Use Treatise",
          path: "/professions",
          localOrder: 1
        }),
        candidate({
          characterId: "c1",
          characterName: "Synblast",
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: "Leatherworking: Complete weekly quest",
          path: "/professions",
          localOrder: 2
        })
      ],
      seasonFacts: [{ characterId: "c1", goalsOpen: 1, goalsUnknown: 0 }]
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.next?.action).toBe("2 more M+ runs for Vault slot 2");
    expect(rows[0]?.after?.action).toBe("Complete 4pc tier set");
    expect(rows[0]?.status).toBe("2 open");
  });

  it("uses Season as NEXT when Weeklies gameplay is complete", () => {
    const rows = projectOverviewGameplayPriorities({
      gameplayCharacters: [
        {
          characterId: "c1",
          characterName: "Synbloom",
          className: "Druid"
        }
      ],
      actions: [
        candidate({
          characterId: "c1",
          characterName: "Synbloom",
          source: "SEASON",
          horizon: "SEASONAL",
          action: "Complete 4pc tier set",
          path: "/season"
        })
      ],
      seasonFacts: [{ characterId: "c1", goalsOpen: 1, goalsUnknown: 0 }]
    });

    expect(rows[0]?.next?.action).toBe("Complete 4pc tier set");
    expect(rows[0]?.after).toBeNull();
  });

  it("uses ? for AFTER when Season is unknown without inventing work", () => {
    const rows = projectOverviewGameplayPriorities({
      gameplayCharacters: [
        {
          characterId: "c1",
          characterName: "Synlight",
          className: "Priest"
        }
      ],
      actions: [
        candidate({
          characterId: "c1",
          characterName: "Synlight",
          source: "WEEKLIES",
          horizon: "WEEKLY",
          action: "3 more M+ runs for Vault slot 2",
          path: "/weekly-checklist"
        })
      ],
      seasonFacts: [{ characterId: "c1", goalsOpen: 0, goalsUnknown: 1 }]
    });

    expect(rows[0]?.next?.action).toBe("3 more M+ runs for Vault slot 2");
    expect(rows[0]?.after?.action).toBe("?");
    expect(rows[0]?.status).toContain("unknown");
  });

  it("never emits more than one gameplay row per Character", () => {
    const projection = projectOverviewDecisionSurfaces({
      gameplayCharacters: [
        {
          characterId: "c1",
          characterName: "Synmist",
          className: "Mage"
        }
      ],
      actions: [
        candidate({
          characterId: "c1",
          characterName: "Synmist",
          source: "WEEKLIES",
          horizon: "WEEKLY",
          action: "1 M+ run for Vault slot 1",
          path: "/weekly-checklist"
        }),
        candidate({
          characterId: "c1",
          characterName: "Synmist",
          source: "SEASON",
          horizon: "SEASONAL",
          action: "Complete 4pc tier set"
        }),
        candidate({
          characterId: "c1",
          characterName: "Synmist",
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: "Alchemy: Use Treatise",
          path: "/professions",
          localOrder: 1
        })
      ],
      seasonFacts: [{ characterId: "c1", goalsOpen: 2, goalsUnknown: 1 }]
    });

    expect(projection.gameplayPriorities).toHaveLength(1);
  });
});

describe("projectOverviewProfessionWork", () => {
  it("groups three weekly profession actions into one Character row with +2", () => {
    const rows = projectOverviewProfessionWork([
      candidate({
        characterId: "c1",
        characterName: "Synbeam",
        source: "PROFESSIONS",
        horizon: "WEEKLY",
        action: "Blacksmithing: Use Treatise",
        path: "/professions",
        localOrder: 1
      }),
      candidate({
        characterId: "c1",
        characterName: "Synbeam",
        source: "PROFESSIONS",
        horizon: "WEEKLY",
        action: "Blacksmithing: Gather weekly drops",
        path: "/professions",
        localOrder: 2
      }),
      candidate({
        characterId: "c1",
        characterName: "Synbeam",
        source: "PROFESSIONS",
        horizon: "WEEKLY",
        action: "Jewelcrafting: Use Treatise",
        path: "/professions",
        localOrder: 3
      })
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.next.action).toBe("Blacksmithing: Use Treatise");
    expect(rows[0]?.additionalActionCount).toBe(2);
  });

  it("keeps profession-only Characters out of gameplay priorities", () => {
    const projection = projectOverviewDecisionSurfaces({
      gameplayCharacters: [],
      actions: [
        candidate({
          characterId: "c-prof",
          characterName: "Synbeam",
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: "Blacksmithing: Use Treatise",
          path: "/professions",
          localOrder: 1
        }),
        candidate({
          characterId: "c-prof",
          characterName: "Synbeam",
          source: "PROFESSIONS",
          horizon: "WEEKLY",
          action: "Jewelcrafting: Use Treatise",
          path: "/professions",
          localOrder: 2
        })
      ],
      seasonFacts: []
    });

    expect(projection.gameplayPriorities).toHaveLength(0);
    expect(projection.professionWork).toHaveLength(1);
    expect(projection.professionWork[0]?.additionalActionCount).toBe(1);
  });
});

describe("projectOverviewSetupAttention", () => {
  it("separates permanent setup from weekly profession work", () => {
    const actions = [
      candidate({
        characterId: "c1",
        characterName: "Synbeast",
        source: "PROFESSIONS",
        horizon: "WEEKLY",
        action: "Engineering: Use Treatise",
        path: "/professions",
        localOrder: 1
      }),
      candidate({
        characterId: "c1",
        characterName: "Synbeast",
        source: "PROFESSIONS",
        horizon: "PERMANENT",
        action: "Engineering: Collect missing Knowledge Treasures",
        path: "/professions",
        localOrder: 0
      })
    ];

    const weekly = projectOverviewProfessionWork(actions);
    const setup = projectOverviewSetupAttention(actions);

    expect(weekly).toHaveLength(1);
    expect(weekly[0]?.next.action).toBe("Engineering: Use Treatise");
    expect(setup).toHaveLength(1);
    expect(setup[0]?.next.action).toBe(
      "Engineering: Collect missing Knowledge Treasures"
    );
  });
});
