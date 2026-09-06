import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ingestObservationConfig } from "../../ingest-observation/ingest-observation.config.js";
import type { IngestObservationRow } from "../../ingest-observation/ingest-observation.types.js";
import { BattleNetClient } from "./battlenet.client.js";

/*
 * Phase G3B proof points (task section 24, BLIZZARD): Equipment/Profile/
 * Professions/Mythic+ raw responses are captured before any SynTrack
 * mapper runs. battlenet.client.ts itself never maps a response - it
 * only decodes JSON and returns it - so "before the mapper" is proven
 * here by confirming the captured payload is exactly the raw decoded
 * body, byte for byte, with no SynTrack-side transformation.
 */

const REAL_ACCESS_TOKEN = "very-secret-access-token-should-never-be-stored";

function tempDbPath(): string {
  return path.join(
    os.tmpdir(),
    `syntrack-battlenet-observation-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const createdPaths: string[] = [];
const originalEnabled = ingestObservationConfig.enabled;
const originalDatabasePath = ingestObservationConfig.databasePath;

afterEach(() => {
  vi.unstubAllGlobals();
  ingestObservationConfig.enabled = originalEnabled;
  ingestObservationConfig.databasePath = originalDatabasePath;

  for (const createdPath of createdPaths.splice(0)) {
    fs.rmSync(createdPath, { force: true, recursive: true });
  }
});

function setUpObservation(): string {
  const databasePath = tempDbPath();
  createdPaths.push(databasePath);
  ingestObservationConfig.enabled = true;
  ingestObservationConfig.databasePath = databasePath;
  return databasePath;
}

describe("BattleNetClient - G3B raw observation capture", () => {
  it("captures the raw Equipment response before any mapper runs", async () => {
    const databasePath = setUpObservation();
    const rawEquipment = { equipped_items: [{ item: { id: 219749 }, level: { value: 473 } }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rawEquipment)));

    const client = new BattleNetClient();
    const result = await client.getCharacterEquipment(REAL_ACCESS_TOKEN, "antonidas", "Synbeast");

    expect(result).toEqual(rawEquipment);

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "BLIZZARD",
      domain: "EQUIPMENT",
      stage: "RAW",
      endpoint: "character-equipment",
      realmSlug: "antonidas",
      characterName: "Synbeast",
      httpStatus: 200
    });
    expect(JSON.parse(rows[0]!.payloadJson)).toEqual(rawEquipment);
  });

  it("captures the raw Profile response before any mapper runs", async () => {
    const databasePath = setUpObservation();
    const rawProfile = { name: "Synbeast", level: 80, character_class: { name: "Shaman" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rawProfile)));

    const client = new BattleNetClient();
    await client.getCharacterProfile(REAL_ACCESS_TOKEN, "antonidas", "Synbeast");

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ domain: "PROFILE", endpoint: "character-profile" });
    expect(JSON.parse(rows[0]!.payloadJson)).toEqual(rawProfile);
  });

  it("captures the raw Professions response before any mapper runs", async () => {
    const databasePath = setUpObservation();
    const rawProfessions = { primaries: [{ profession: { name: "Blacksmithing" } }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rawProfessions)));

    const client = new BattleNetClient();
    await client.getCharacterProfessions(REAL_ACCESS_TOKEN, "antonidas", "Synbeast");

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ domain: "PROFESSIONS", endpoint: "character-professions" });
    expect(JSON.parse(rows[0]!.payloadJson)).toEqual(rawProfessions);
  });

  it("captures the raw Mythic+ keystone profile response before any mapper runs", async () => {
    const databasePath = setUpObservation();
    const rawMythicPlus = { current_period: { period: { id: 999 } }, current_mythic_rating: { rating: 2100 } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rawMythicPlus)));

    const client = new BattleNetClient();
    await client.getCharacterMythicKeystoneProfile(REAL_ACCESS_TOKEN, "antonidas", "Synbeast");

    const rows = readAllRows(databasePath);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ domain: "MYTHIC_PLUS", endpoint: "mythic-keystone-profile" });
    expect(JSON.parse(rows[0]!.payloadJson)).toEqual(rawMythicPlus);
  });

  it("does NOT capture account-level user-OAuth discovery calls (getAccountProfile) - out of G3B scope", async () => {
    const databasePath = setUpObservation();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ wow_accounts: [] }))
    );

    const client = new BattleNetClient();
    await client.getAccountProfile(REAL_ACCESS_TOKEN);

    expect(readAllRows(databasePath)).toHaveLength(0);
  });

  it("does NOT capture guild roster calls - out of G3B's character-domain scope", async () => {
    const databasePath = setUpObservation();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ members: [] })));

    const client = new BattleNetClient();
    await client.getGuildRoster(REAL_ACCESS_TOKEN, "antonidas", "some-guild");

    expect(readAllRows(databasePath)).toHaveLength(0);
  });

  it("never persists the Authorization header or the raw access token, even if the payload happens to contain a same-named key", async () => {
    const databasePath = setUpObservation();
    // A deliberately pathological response - real Blizzard never sends
    // this - proving the sanitizer's defense-in-depth actually redacts it.
    const suspiciousPayload = {
      equipped_items: [],
      access_token: "leaked-token-should-be-redacted"
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(suspiciousPayload)));

    const client = new BattleNetClient();
    await client.getCharacterEquipment(REAL_ACCESS_TOKEN, "antonidas", "Synbeast");

    const rows = readAllRows(databasePath);
    const rawFileContents = fs.readFileSync(databasePath).toString("latin1");

    expect(rawFileContents).not.toContain(REAL_ACCESS_TOKEN);
    expect(rows[0]!.payloadJson).not.toContain("leaked-token-should-be-redacted");
    expect(JSON.parse(rows[0]!.payloadJson).access_token).toBe("[REDACTED]");
  });

  it("still returns the response normally when the observation database is completely unavailable", async () => {
    const brokenPath = tempDbPath();
    createdPaths.push(brokenPath);
    fs.mkdirSync(brokenPath, { recursive: true });
    ingestObservationConfig.enabled = true;
    ingestObservationConfig.databasePath = brokenPath;

    const rawEquipment = { equipped_items: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rawEquipment)));

    const client = new BattleNetClient();

    await expect(
      client.getCharacterEquipment(REAL_ACCESS_TOKEN, "antonidas", "Synbeast")
    ).resolves.toEqual(rawEquipment);
  });
});
