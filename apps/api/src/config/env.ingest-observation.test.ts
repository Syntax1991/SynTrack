import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * Phase G3B corrective follow-up: proves the environment-sensitive
 * default for INGEST_OBSERVATION_ENABLED without touching the
 * observation architecture itself - env.ts is a module with import-time
 * side effects (it parses process.env once at load), so each scenario
 * mutates process.env, resets the module registry, and re-imports it
 * fresh. Every other env var keeps its own default/existing value.
 */

const CONTROLLED_KEYS = ["NODE_ENV", "INGEST_OBSERVATION_ENABLED"] as const;
const originalValues = new Map(
  CONTROLLED_KEYS.map((key) => [key, process.env[key]])
);

async function loadEnvWith(
  overrides: Partial<Record<(typeof CONTROLLED_KEYS)[number], string>>
) {
  for (const key of CONTROLLED_KEYS) {
    const value = overrides[key];

    if (value === undefined) {
      delete process.env[key];
    }
    else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
  const module = await import("./env.js");
  return module.env;
}

afterEach(() => {
  for (const key of CONTROLLED_KEYS) {
    const original = originalValues.get(key);

    if (original === undefined) {
      delete process.env[key];
    }
    else {
      process.env[key] = original;
    }
  }

  vi.resetModules();
});

describe("INGEST_OBSERVATION_ENABLED - environment-sensitive default", () => {
  it("production + variable absent -> disabled (safe by default)", async () => {
    const env = await loadEnvWith({ NODE_ENV: "production" });
    expect(env.INGEST_OBSERVATION_ENABLED).toBe(false);
  });

  it("production + explicit true -> enabled (explicit opt-in respected)", async () => {
    const env = await loadEnvWith({
      NODE_ENV: "production",
      INGEST_OBSERVATION_ENABLED: "true"
    });
    expect(env.INGEST_OBSERVATION_ENABLED).toBe(true);
  });

  it("development + variable absent -> enabled (local debugging convenience)", async () => {
    const env = await loadEnvWith({ NODE_ENV: "development" });
    expect(env.INGEST_OBSERVATION_ENABLED).toBe(true);
  });

  it("test + variable absent -> disabled (safest/deterministic, matches production's posture)", async () => {
    const env = await loadEnvWith({ NODE_ENV: "test" });
    expect(env.INGEST_OBSERVATION_ENABLED).toBe(false);
  });

  it("explicit false disables regardless of the environment's own default", async () => {
    const developmentDisabled = await loadEnvWith({
      NODE_ENV: "development",
      INGEST_OBSERVATION_ENABLED: "false"
    });
    expect(developmentDisabled.INGEST_OBSERVATION_ENABLED).toBe(false);

    const productionAlreadyDisabled = await loadEnvWith({
      NODE_ENV: "production",
      INGEST_OBSERVATION_ENABLED: "0"
    });
    expect(productionAlreadyDisabled.INGEST_OBSERVATION_ENABLED).toBe(false);
  });

  it("explicit true enables in every environment that permits an override", async () => {
    const production = await loadEnvWith({
      NODE_ENV: "production",
      INGEST_OBSERVATION_ENABLED: "1"
    });
    expect(production.INGEST_OBSERVATION_ENABLED).toBe(true);

    const test = await loadEnvWith({
      NODE_ENV: "test",
      INGEST_OBSERVATION_ENABLED: "1"
    });
    expect(test.INGEST_OBSERVATION_ENABLED).toBe(true);
  });

  it("rejects an unrecognized explicit value instead of silently treating it as enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.INGEST_OBSERVATION_ENABLED = "yes";
    vi.resetModules();

    await expect(import("./env.js")).rejects.toThrow(
      /Invalid environment configuration/
    );
  });
});
