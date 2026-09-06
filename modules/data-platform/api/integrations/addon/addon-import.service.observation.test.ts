import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ingestObservationConfig } from "../../ingest-observation/ingest-observation.config.js";
import type { IngestObservationRow } from "../../ingest-observation/ingest-observation.types.js";
import { AddonImportService } from "./addon-import.service.js";
import type { AddonImportPersistence } from "./addon-import.persistence.js";
import type { AddonImportResult } from "./addon-import.types.js";

/*
 * Real integration point for Phase G3B's ADDON/GEAR requirement: exercises
 * the actual LuaSavedVariablesParser -> AddonImportService pipeline (not
 * just the pure captureRawAddonGearObservations() helper covered by
 * addon-import.raw-observation.test.ts). AddonImportPersistence.persist()
 * always runs against the real prisma singleton with no DI seam, so a
 * fake persistence object is substituted here - proven safe by this
 * codebase's existing "cast a fake object to the real class type" DI
 * pattern (see e.g. gear-readiness.service.wiring.test.ts) - specifically
 * so this test can prove the observation/import wiring end to end
 * without ever touching real dev.db, per the task's explicit "do not
 * force a real import merely to generate an observation" instruction.
 */

const synbeastLiveGearLua = `
SynTrackCoreDB = {
  ["format"] = "syntrack-saved-variables",
  ["schemaVersion"] = 1,
  ["characters"] = {
    ["eu:antonidas:synbeast"] = {
      ["name"] = "Synbeast",
      ["realm"] = "Antonidas",
      ["region"] = "EU",
      ["className"] = "Shaman",
      ["level"] = 80,
      ["modules"] = {
        ["gear"] = {
          ["schemaVersion"] = 2,
          ["data"] = {
            ["currentExpansionId"] = 11,
            ["slots"] = {
              ["HEAD"] = {
                ["equipped"] = true,
                ["itemId"] = 219749,
                ["itemLink"] = "item:219749:0::::::::::::::::",
                ["itemLevel"] = 473,
                ["quality"] = 4,
                ["socketCount"] = 0
              }
            },
            ["bagSetPieces"] = {}
          }
        }
      }
    }
  }
}
`;

const fakeImportResult: AddonImportResult = {
  addonVersion: "test",
  schemaVersion: 1,
  importedAt: new Date().toISOString(),
  processed: {
    catalogs: 0,
    trees: 0,
    specializationNodes: 0,
    characters: 1,
    professionAssignments: 0,
    progressEntries: 0,
    gearSlots: 1,
    resourceSnapshots: 0,
    professionWeeklySnapshots: 0,
    professionKnowledgeTreasureSnapshots: 0,
    weeklyGameplaySnapshots: 0,
    weekliesSignalSnapshots: 0,
    seasonEvidenceSnapshots: 0
  }
};

function fakePersistence(): AddonImportPersistence {
  return {
    persist: async () => fakeImportResult
  } as unknown as AddonImportPersistence;
}

function tempDbPath(): string {
  return path.join(
    os.tmpdir(),
    `syntrack-service-observation-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  );
}

function readAllRows(databasePath: string): IngestObservationRow[] {
  if (!fs.existsSync(databasePath)) {
    return [];
  }

  const db = new Database(databasePath, { readonly: true });

  try {
    return db
      .prepare("SELECT * FROM ingest_observations ORDER BY id ASC")
      .all() as IngestObservationRow[];
  }
  finally {
    db.close();
  }
}

const createdPaths: string[] = [];
const originalEnabled = ingestObservationConfig.enabled;
const originalDatabasePath = ingestObservationConfig.databasePath;

afterEach(() => {
  ingestObservationConfig.enabled = originalEnabled;
  ingestObservationConfig.databasePath = originalDatabasePath;

  for (const createdPath of createdPaths.splice(0)) {
    fs.rmSync(createdPath, { force: true, recursive: true });
  }
});

describe("AddonImportService - G3B raw observation wiring", () => {
  it("preview() never captures a raw observation - it is a dry run, not a real import", () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    const service = new AddonImportService(fakePersistence());

    service.preview(synbeastLiveGearLua);

    expect(readAllRows(databasePath)).toHaveLength(0);
  });

  it("importSavedVariables() captures the raw ADDON/GEAR observation before persistence runs", async () => {
    const databasePath = tempDbPath();
    createdPaths.push(databasePath);
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = databasePath;

    const service = new AddonImportService(fakePersistence());

    const result = await service.importSavedVariables(synbeastLiveGearLua);

    expect(result).toEqual(fakeImportResult);

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "ADDON",
      domain: "GEAR",
      characterName: "Synbeast",
      realmSlug: "Antonidas"
    });

    const head = JSON.parse(rows[0]!.payloadJson).data.slots.HEAD;
    expect(head.itemId).toBe(219749);
    expect(head.itemLink).toBe("item:219749:0::::::::::::::::");
  });

  it("importSavedVariables() still succeeds when the observation database is completely unavailable", async () => {
    const brokenPath = tempDbPath();
    createdPaths.push(brokenPath);
    fs.mkdirSync(brokenPath, { recursive: true });
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = brokenPath;

    const service = new AddonImportService(fakePersistence());

    await expect(
      service.importSavedVariables(synbeastLiveGearLua)
    ).resolves.toEqual(fakeImportResult);
  });
});
