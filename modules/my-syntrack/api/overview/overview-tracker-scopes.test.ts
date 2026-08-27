import { describe, expect, it } from "vitest";
import { combinePinnedTrackerColumns } from "./overview-tracker-scopes.js";
import type { TrackerDefinitionView } from "./overview.types.js";

function buildDefinition(
  overrides: Partial<TrackerDefinitionView> = {}
): TrackerDefinitionView {
  return {
    id: "def-1",
    scopeKey: "MIDNIGHT-S1",
    key: "world-tour",
    name: "World Tour",
    valueType: "BOOLEAN",
    resetBehavior: "SEASONAL",
    category: null,
    sortOrder: 0,
    isPinned: true,
    enabled: true,
    ...overrides
  };
}

describe("combinePinnedTrackerColumns", () => {
  it("includes a pinned seasonal tracker and a pinned GLOBAL tracker together", () => {
    const seasonal = [
      buildDefinition({
        id: "season-def",
        scopeKey: "MIDNIGHT-S1"
      })
    ];

    const global = [
      buildDefinition({
        id: "global-def",
        scopeKey: "GLOBAL",
        key: "permanent-goal",
        name: "Permanent Goal"
      })
    ];

    const columns =
      combinePinnedTrackerColumns(
        seasonal,
        global
      );

    expect(
      columns.map((c) => c.id)
    ).toEqual([
      "season-def",
      "global-def"
    ]);
  });

  it("GLOBAL trackers appear regardless of which season is active - passing a different seasonal list still includes GLOBAL", () => {
    const seasonalS2 = [
      buildDefinition({
        id: "season-2-def",
        scopeKey: "MIDNIGHT-S2"
      })
    ];

    const global = [
      buildDefinition({
        id: "global-def",
        scopeKey: "GLOBAL"
      })
    ];

    const columns =
      combinePinnedTrackerColumns(
        seasonalS2,
        global
      );

    expect(
      columns.some(
        (c) => c.id === "global-def"
      )
    ).toBe(true);
  });

  it("still excludes an unpinned seasonal tracker and a disabled GLOBAL tracker", () => {
    const seasonal = [
      buildDefinition({
        id: "unpinned-def",
        isPinned: false
      })
    ];

    const global = [
      buildDefinition({
        id: "disabled-global-def",
        scopeKey: "GLOBAL",
        enabled: false
      })
    ];

    const columns =
      combinePinnedTrackerColumns(
        seasonal,
        global
      );

    expect(columns).toHaveLength(0);
  });

  it("returns no columns when both scopes are empty", () => {
    expect(
      combinePinnedTrackerColumns(
        [],
        []
      )
    ).toEqual([]);
  });
});
