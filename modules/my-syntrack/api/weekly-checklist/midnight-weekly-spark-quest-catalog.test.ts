import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MIDNIGHT_WEEKLY_SPARK_QUESTS,
  REQUIRED_SPARK_QUEST_AUDIT_IDS,
  metaEligibleSparkQuestIds,
  sparkQuestById
} from "./midnight-weekly-spark-quest-catalog.js";
import { deriveMetaQuestCompletion } from "./midnight-weekly-spark-meta.js";

const here = dirname(fileURLToPath(import.meta.url));
const luaCatalogPath = join(
  here,
  "../../../data-platform/addons/SynTrack_Core/WeekliesSignalsCatalog.lua"
);

describe("midnight weekly spark quest catalog", () => {
  it("classifies every required audit Quest ID explicitly", () => {
    for (const questId of REQUIRED_SPARK_QUEST_AUDIT_IDS) {
      const entry = sparkQuestById(questId);
      expect(entry, `missing classification for ${questId}`).toBeDefined();
      expect(entry!.classification).toBeTruthy();
      expect(entry!.productRole).toBeTruthy();
      expect(entry!.family).toBeTruthy();
      expect(typeof entry!.enabled).toBe("boolean");
    }
  });

  it("does not enable World Tour or Spark follow-up for META", () => {
    expect(sparkQuestById(95245)).toMatchObject({
      enabled: false,
      productRole: "NOT_META",
      classification: "ONE_TIME"
    });
    expect(sparkQuestById(96446)).toMatchObject({
      enabled: false,
      productRole: "NOT_META",
      classification: "FOLLOW_UP"
    });
  });

  it("marks stale 95520 tracker as historical / not META", () => {
    expect(sparkQuestById(95520)).toMatchObject({
      enabled: false,
      productRole: "STALE_TRACKER",
      classification: "LIVE_HISTORICAL"
    });
  });

  it("enables Trailing Xal'atath and Turn Back the Surge as META alternatives", () => {
    expect(sparkQuestById(98172)).toMatchObject({
      enabled: true,
      productRole: "META_ALTERNATIVE"
    });
    expect(sparkQuestById(96995)).toMatchObject({
      enabled: true,
      productRole: "META_ALTERNATIVE"
    });
  });

  it("enables every Sparks of War zone variant as META alternatives", () => {
    for (const questId of [93423, 93424, 93425, 93426, 96725, 96726]) {
      expect(sparkQuestById(questId)).toMatchObject({
        family: "SPARKS_OF_WAR",
        enabled: true,
        productRole: "META_ALTERNATIVE",
        classification: "LIVE_CURRENT"
      });
    }
  });

  it("keeps Lua metaQuest.questIds aligned with eligible catalog IDs", () => {
    const lua = readFileSync(luaCatalogPath, "utf8");
    const block = lua.match(
      /metaQuest\s*=\s*\{[\s\S]*?questIds\s*=\s*\{([^}]*)\}/
    );
    expect(block).toBeTruthy();
    const luaIds = [...(block?.[1] ?? "").matchAll(/(\d+)/g)].map(
      (match) => Number(match[1])
    );
    expect(luaIds.sort((a, b) => a - b)).toEqual(
      [...metaEligibleSparkQuestIds()].sort((a, b) => a - b)
    );
  });

  it("catalog has unique quest IDs", () => {
    const ids = MIDNIGHT_WEEKLY_SPARK_QUESTS.map((entry) => entry.questId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("deriveMetaQuestCompletion", () => {
  const eligible = metaEligibleSparkQuestIds();

  function evidence(
    overrides: Record<number, boolean | null>
  ) {
    return eligible.map((questId) => ({
      questId,
      flaggedCompleted:
        questId in overrides ? overrides[questId]! : false
    }));
  }

  it("one Unity child true → COMPLETE", () => {
    const derived = deriveMetaQuestCompletion(
      evidence({ 93911: true }),
      eligible
    );
    expect(derived).toEqual({
      state: "COMPLETE",
      determiningQuestId: 93911,
      flaggedCompleted: true
    });
  });

  it.each(
    eligible.filter((id) => sparkQuestById(id)?.family === "UNITY_META")
  )("Unity/meta eligible %s true → COMPLETE", (questId) => {
    const derived = deriveMetaQuestCompletion(
      evidence({ [questId]: true }),
      eligible
    );
    expect(derived.state).toBe("COMPLETE");
    expect(derived.determiningQuestId).toBe(questId);
  });

  it("98232 Vaults true → COMPLETE", () => {
    expect(
      deriveMetaQuestCompletion(evidence({ 98232: true }), eligible)
        .state
    ).toBe("COMPLETE");
  });

  it("98172 Trailing true → COMPLETE (same weekly Spark alternative)", () => {
    expect(
      deriveMetaQuestCompletion(evidence({ 98172: true }), eligible)
    ).toMatchObject({
      state: "COMPLETE",
      determiningQuestId: 98172
    });
  });

  it("95245 World Tour true alone must NOT complete META", () => {
    const withoutTour = eligible.map((questId) => ({
      questId,
      flaggedCompleted: false as boolean | null
    }));
    // World Tour is not eligible — injecting it must not flip META.
    withoutTour.push({ questId: 95245, flaggedCompleted: true });
    expect(
      deriveMetaQuestCompletion(withoutTour, eligible).state
    ).toBe("INCOMPLETE");
  });

  it("96446 Spark follow-up true alone must NOT complete META", () => {
    const rows = eligible.map((questId) => ({
      questId,
      flaggedCompleted: false as boolean | null
    }));
    rows.push({ questId: 96446, flaggedCompleted: true });
    expect(deriveMetaQuestCompletion(rows, eligible).state).toBe(
      "INCOMPLETE"
    );
  });

  it.each([93423, 93424, 93425, 93426, 96725, 96726])(
    "Sparks of War %s true → COMPLETE",
    (questId) => {
      expect(
        deriveMetaQuestCompletion(evidence({ [questId]: true }), eligible)
          .state
      ).toBe("COMPLETE");
    }
  );

  it("all known false → INCOMPLETE open", () => {
    expect(deriveMetaQuestCompletion(evidence({}), eligible)).toEqual({
      state: "INCOMPLETE",
      determiningQuestId: eligible[0],
      flaggedCompleted: false
    });
  });

  it("partial unresolved without true → UNKNOWN", () => {
    const rows = eligible.map((questId, index) => ({
      questId,
      flaggedCompleted: index === 0 ? (null as boolean | null) : false
    }));
    expect(deriveMetaQuestCompletion(rows, eligible)).toEqual({
      state: "UNKNOWN",
      determiningQuestId: null,
      flaggedCompleted: null
    });
  });

  it("account-style: first false then later true still COMPLETE", () => {
    const derived = deriveMetaQuestCompletion(
      evidence({ 93744: false, 98172: true }),
      eligible
    );
    expect(derived.state).toBe("COMPLETE");
    expect(derived.determiningQuestId).toBe(98172);
  });
});
