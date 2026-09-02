import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";

const here = dirname(fileURLToPath(import.meta.url));
const luaCatalogPath = join(
  here,
  "../../../data-platform/addons/SynTrack_Core/SeasonEvidenceCatalog.lua"
);

function parseLuaIdMap(source: string, tableName: string) {
  const blockMatch = source.match(
    new RegExp(`${tableName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m")
  );
  const body = blockMatch?.[1];

  if (!body) {
    throw new Error(`Missing Lua table ${tableName}`);
  }

  return [...body.matchAll(/\["([^"]+)"\]\s*=\s*(\d+)/g)].map(
    (match) => ({
      key: match[1] as string,
      id: Number(match[2])
    })
  );
}

describe("season evidence catalog parity", () => {
  it("keeps Lua and backend tracker keys / IDs aligned", () => {
    const lua = readFileSync(luaCatalogPath, "utf8");
    const luaAchievements = parseLuaIdMap(lua, "achievements");
    const luaQuests = parseLuaIdMap(lua, "quests");

    const backendAchievements = SEASON_EVIDENCE_CATALOG.filter(
      (entry) => entry.evidenceKind === "ACHIEVEMENT"
    ).map((entry) => ({
      key: entry.trackerKey,
      id: entry.externalId
    }));
    const backendQuests = SEASON_EVIDENCE_CATALOG.filter(
      (entry) => entry.evidenceKind === "QUEST"
    ).map((entry) => ({
      key: entry.trackerKey,
      id: entry.externalId
    }));

    expect(luaAchievements).toEqual(
      expect.arrayContaining(backendAchievements)
    );
    expect(backendAchievements).toEqual(
      expect.arrayContaining(luaAchievements)
    );
    expect(luaAchievements).toHaveLength(backendAchievements.length);
    expect(luaQuests).toEqual(
      expect.arrayContaining(backendQuests)
    );
    expect(backendQuests).toEqual(
      expect.arrayContaining(luaQuests)
    );
  });
});
