import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import { resolveSeasonAchievementCompletion } from "./season-achievement-evidence.js";
import {
  deriveBooleanEvidenceGoal,
  deriveRaidGoal,
  deriveWarbandBooleanGoal,
  deriveWarbandPortalsGoal
} from "./season-checklist.evidence.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";
import {
  LEGACY_CRACKED_KEYSTONE_TRACKER_KEY,
  primarySeasonEvidenceForGoal,
  SEASON_EVIDENCE_CATALOG
} from "./season-evidence-catalog.js";

function resolved(
  key: string,
  completed: boolean | null
) {
  const definition: TrackerDefinitionRow = {
    id: key,
    scopeKey: "MIDNIGHT-S2",
    key,
    name: key,
    valueType: "BOOLEAN",
    resetBehavior: "SEASONAL",
    category: "SEASON_EVIDENCE",
    sortOrder: 1,
    isPinned: false,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const state: CharacterTrackerState | null = completed === null
    ? null
    : {
        trackerDefinitionId: key,
        characterId: "char-1",
        periodKey: "ALWAYS",
        state: "RECORDED",
        source: "ADDON",
        value: { valueType: "BOOLEAN", boolean: completed }
      };

  return { definition, state };
}

function signal(
  state: SeasonGoalSignal["state"],
  label: string
): SeasonGoalSignal {
  return {
    key: "tier-visual",
    title: "Tier",
    state,
    label,
    detail: "Tier",
    actionLabel: state === "INCOMPLETE" ? "Earn" : null
  };
}

describe("season achievement scope resolution", () => {
  it("CHARACTER: account complete + not earned by character → incomplete", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, false)
    ).toBe(false);
  });

  it("WARBAND: account complete + not earned by character → complete", () => {
    expect(
      resolveSeasonAchievementCompletion("WARBAND", true, false)
    ).toBe(true);
  });

  it("CHARACTER: account complete + earnedByCharacter nil → unknown", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, null)
    ).toBeNull();
  });

  it("WARBAND: accountCompleted nil → unknown regardless of earnedByCharacter", () => {
    expect(
      resolveSeasonAchievementCompletion("WARBAND", null, true)
    ).toBeNull();
  });
});

describe("season evidence derivation", () => {
  it("derives boolean complete, incomplete and unknown", () => {
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", true)
      ).state
    ).toBe("COMPLETE");
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", false)
      ).state
    ).toBe("INCOMPLETE");
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", null)
      ).state
    ).toBe("UNKNOWN");
  });

  it("warband portals: exact fraction only when all 8 are known", () => {
    const perPortalUnknown = Array.from({ length: 8 }, () => [
      signal("UNKNOWN", "?")
    ]);
    expect(deriveWarbandPortalsGoal(perPortalUnknown).label).toBe("?");

    const perPortalAllKnownPartial = Array.from({ length: 8 }, (_, index) => [
      signal(index < 5 ? "COMPLETE" : "INCOMPLETE", index < 5 ? "✓" : "✕")
    ]);
    const allKnownPartial = deriveWarbandPortalsGoal(perPortalAllKnownPartial);
    expect(allKnownPartial.state).toBe("INCOMPLETE");
    expect(allKnownPartial.label).toBe("5/8");

    const perPortalAllComplete = Array.from({ length: 8 }, () => [
      signal("COMPLETE", "✓")
    ]);
    expect(deriveWarbandPortalsGoal(perPortalAllComplete).label).toBe(
      "✓ 8/8"
    );
  });

  it("warband portals: any unresolved portal -> UNKNOWN, never a partial exact fraction", () => {
    const perPortal = Array.from({ length: 8 }, (_, index) => {
      if (index < 3) {
        return [signal("COMPLETE", "✓")];
      }
      if (index < 5) {
        return [signal("INCOMPLETE", "✕")];
      }
      return [signal("UNKNOWN", "?")];
    });

    const partialUnknown = deriveWarbandPortalsGoal(perPortal);

    expect(partialUnknown.state).toBe("UNKNOWN");
    expect(partialUnknown.label).toBe("?");
  });

  it("warband portals: a legacy Character false never leaks into the Warband aggregate", () => {
    // The old CHARACTER-scoped tracker's persisted `false` must never be
    // read by the new Warband derivation — only signals sourced from the
    // new accountCompleted-backed tracker key are ever passed in.
    const legacyCharacterSignal = deriveBooleanEvidenceGoal(
      resolved("season-portal-62437", false)
    );
    expect(legacyCharacterSignal.state).toBe("INCOMPLETE");

    // The new Warband tracker has no persisted value yet for any Character.
    const perPortalWithNewTrackerUnresolved = [
      [deriveBooleanEvidenceGoal(resolved("season-warband-portal-62437-v2", null))],
      ...Array.from({ length: 7 }, () => [signal("UNKNOWN", "?")])
    ];

    const result = deriveWarbandPortalsGoal(perPortalWithNewTrackerUnresolved);

    expect(result.state).toBe("UNKNOWN");
    expect(result.label).toBe("?");
  });

  it("valeera: completion-only accountCompleted evidence, never a fabricated level", () => {
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-63435", true),
        "valeera-80"
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓" });

    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-63435", false),
        "valeera-80"
      )
    ).toMatchObject({ state: "INCOMPLETE", label: "✕" });

    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-63435", null),
        "valeera-80"
      )
    ).toMatchObject({ state: "UNKNOWN", label: "?" });
  });

  it("raid: conservative partial UNKNOWN and CE preference", () => {
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", null),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "UNKNOWN", label: "?" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", false),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "INCOMPLETE", label: "✕ AOTC" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓ AOTC" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", false),
        resolved("season-achievement-63651", true)
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓ CE" });
  });

  it("warband aggregation completes from profession-only character evidence", () => {
    const gameplayA = signal("UNKNOWN", "?");
    const gameplayB = signal("UNKNOWN", "?");
    const professionOnlyC = signal("COMPLETE", "✓");

    const derived = deriveWarbandBooleanGoal(
      [gameplayA, gameplayB, professionOnlyC],
      "tier-visual"
    );

    expect(derived.state).toBe("COMPLETE");
    expect(derived.label).toBe("✓");
    expect(derived.title).toBe("Sssensational!");
    expect(derived.detail).toBe("Enhanced Season 2 tier visuals");
    expect(derived.detail).not.toMatch(/\d{4,}/);
  });

  it("cracked 97910 complete / incomplete / unknown with product labels", () => {
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-quest-cracked-keystone-97910", true),
        "cracked-keystone"
      )
    ).toMatchObject({
      state: "COMPLETE",
      label: "✓",
      title: "Cracked Keystone",
      actionLabel: null
    });

    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-quest-cracked-keystone-97910", false),
        "cracked-keystone"
      )
    ).toMatchObject({
      state: "INCOMPLETE",
      label: "✕",
      actionLabel: "Complete Cracked Keystone"
    });

    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-quest-cracked-keystone-97910", null),
        "cracked-keystone"
      )
    ).toMatchObject({ state: "UNKNOWN", label: "?" });
  });

  it("legacy 92600 tracker is not consumed for Season cracked", () => {
    expect(
      SEASON_EVIDENCE_CATALOG.some(
        (entry) => entry.trackerKey === LEGACY_CRACKED_KEYSTONE_TRACKER_KEY
      )
    ).toBe(false);
    expect(primarySeasonEvidenceForGoal("cracked-keystone")).toMatchObject({
      trackerKey: "season-quest-cracked-keystone-97910",
      externalId: 97910
    });

    // No fresh 97910 evidence → UNKNOWN (legacy false must not appear as open)
    expect(
      deriveBooleanEvidenceGoal(null, "cracked-keystone")
    ).toMatchObject({ state: "UNKNOWN", label: "?" });
  });

  it("product labels never include raw external IDs", () => {
    const catalyst = deriveBooleanEvidenceGoal(
      resolved("season-achievement-62872", false),
      "serpent-scion"
    );
    const nemesis = deriveBooleanEvidenceGoal(
      resolved("season-achievement-63326", false),
      "nemesis-aztarec"
    );
    const warband = deriveWarbandBooleanGoal(
      [signal("INCOMPLETE", "open")],
      "tier-visual"
    );

    for (const signalValue of [catalyst, nemesis, warband]) {
      expect(JSON.stringify(signalValue)).not.toMatch(
        /62872|63326|63473|97910|92600/
      );
      expect(signalValue.actionLabel ?? "").not.toMatch(/Season evidence/i);
    }

    expect(catalyst.actionLabel).toBe("Earn Serpent Scion");
    expect(nemesis.actionLabel).toBe("Defeat Azta'rec on ??");
  });
});
