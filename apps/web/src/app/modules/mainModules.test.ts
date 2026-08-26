import { describe, expect, it } from "vitest";
import {
  getAvailableModuleItems,
  mainModules
} from "./mainModules";

function findMySynTrack() {
  const module = mainModules.find(
    (candidate) =>
      candidate.id === "my-syntrack"
  );

  if (!module) {
    throw new Error(
      "my-syntrack module not found"
    );
  }

  return module;
}

describe("mainModules - Phase 1 personal control center navigation", () => {
  it("registers only the personal core (My SynTrack) and the Automation roadmap placeholder, never Guild/Loot/Recruitment", () => {
    expect(
      mainModules.map(
        (module) => module.id
      )
    ).toEqual([
      "my-syntrack",
      "automation"
    ]);
  });

  it("nests Professions inside My SynTrack as a single grouped entry with its three real routes, never as a separate top-level module", () => {
    const mySynTrack =
      findMySynTrack();

    const professionsEntries =
      mySynTrack.items.filter(
        (item) =>
          item.label === "Professions"
      );

    expect(
      professionsEntries
    ).toHaveLength(1);

    const [professions] =
      professionsEntries;

    expect(
      professions.path
    ).toBeUndefined();

    expect(
      professions.items?.map(
        (item) => item.label
      )
    ).toEqual([
      "Overview",
      "Find Craft",
      "Specializations"
    ]);

    expect(
      professions.items?.map(
        (item) => item.path
      )
    ).toEqual([
      "/professions",
      "/professions/crafters",
      "/professions/specializations"
    ]);
  });

  it("labels the gear entry 'Gear' (not 'Gear / Enchants / Gems') and keeps exactly one Settings entry", () => {
    const mySynTrack =
      findMySynTrack();

    const gearEntries =
      mySynTrack.items.filter(
        (item) =>
          item.label === "Gear"
      );

    expect(gearEntries).toHaveLength(1);
    expect(gearEntries[0]?.path).toBe(
      "/gear-readiness"
    );

    const settingsEntries =
      mySynTrack.items.filter(
        (item) =>
          item.label === "Settings"
      );

    expect(
      settingsEntries
    ).toHaveLength(1);
  });

  it("never shows Raid Tasks as a My SynTrack navigation entry", () => {
    const mySynTrack =
      findMySynTrack();

    expect(
      mySynTrack.items.some(
        (item) =>
          item.label === "Raid Tasks"
      )
    ).toBe(false);
  });

  it("resolves every available (family, path) route reachable through the sidebar, including nested Professions routes, with no duplicates", () => {
    const mySynTrack =
      findMySynTrack();

    const paths =
      getAvailableModuleItems(
        mySynTrack
      ).map((item) => item.path);

    expect(paths).toEqual([
      "/",
      "/characters",
      "/weekly-checklist",
      "/vault-mythic-plus",
      "/professions",
      "/professions/crafters",
      "/professions/specializations",
      "/gear-readiness",
      "/settings"
    ]);

    expect(
      new Set(paths).size
    ).toBe(paths.length);
  });
});
