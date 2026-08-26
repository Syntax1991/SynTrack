import { describe, expect, it } from "vitest";
import { LuaSavedVariablesParser } from "./lua-saved-variables.parser.js";

/*
 * Acceptance here is entirely content-driven: parse() takes only a
 * source string, never a filename. This is what makes the real
 * SynTrack_Professions.lua file (WoW names it after the addon folder)
 * and the legacy ProfessionTracker.lua file (same folder-naming rule,
 * older addon) both importable without any filename allowlist -
 * both declare the same ProfessionTrackerDB root table.
 */
describe("LuaSavedVariablesParser", () => {
  it("accepts ProfessionTrackerDB - the root table written by both SynTrack_Professions.lua and the legacy ProfessionTracker.lua", () => {
    const table =
      new LuaSavedVariablesParser(
        'ProfessionTrackerDB = { ["schemaVersion"] = 10 }'
      ).parse();

    expect(table.schemaVersion).toBe(10);
  });

  it("accepts SynTrackCoreDB", () => {
    const table =
      new LuaSavedVariablesParser(
        'SynTrackCoreDB = { ["schemaVersion"] = 1 }'
      ).parse();

    expect(table.schemaVersion).toBe(1);
  });

  it("accepts SynTrack_GuildDB", () => {
    const table =
      new LuaSavedVariablesParser(
        'SynTrack_GuildDB = { ["schemaVersion"] = 1 }'
      ).parse();

    expect(table.schemaVersion).toBe(1);
  });

  it("rejects an unsupported root variable name regardless of otherwise-valid content", () => {
    expect(
      () =>
        new LuaSavedVariablesParser(
          'SomeRandomAddonDB = { ["schemaVersion"] = 10 }'
        ).parse()
    ).toThrow(
      /supported SynTrack SavedVariables/u
    );
  });

  it("rejects a supported root variable followed by malformed trailing content", () => {
    expect(
      () =>
        new LuaSavedVariablesParser(
          'ProfessionTrackerDB = { ["schemaVersion"] = 10 } garbage'
        ).parse()
    ).toThrow(
      /Unexpected content/u
    );
  });

  it("rejects a supported root variable whose value is not a table", () => {
    expect(
      () =>
        new LuaSavedVariablesParser(
          "ProfessionTrackerDB = 10"
        ).parse()
    ).toThrow(
      /must be a Lua table/u
    );
  });
});
