import { describe, expect, it } from "vitest";
import { filterPinnedTrackerColumns } from "./overview-tracker-columns.js";
import type { TrackerDefinitionView } from "./overview.types.js";

function buildDefinition(
  overrides: Partial<TrackerDefinitionView>
): TrackerDefinitionView {
  return {
    id: "def-1",
    scopeKey: "MIDNIGHT-S1",
    key: "world-tour",
    name: "World Tour",
    valueType: "BOOLEAN",
    resetBehavior: "WEEKLY",
    category: null,
    sortOrder: 0,
    isPinned: true,
    enabled: true,
    ...overrides
  };
}

describe("filterPinnedTrackerColumns", () => {
  it("a pinned, enabled tracker definition becomes a matrix column", () => {
    const columns = filterPinnedTrackerColumns(
      [
        buildDefinition({
          id: "def-1",
          isPinned: true,
          enabled: true
        })
      ]
    );

    expect(columns).toHaveLength(1);
    expect(columns[0]?.id).toBe(
      "def-1"
    );
  });

  it("an unpinned tracker does not become a column", () => {
    const columns = filterPinnedTrackerColumns(
      [
        buildDefinition({
          id: "def-2",
          isPinned: false,
          enabled: true
        })
      ]
    );

    expect(columns).toHaveLength(0);
  });

  it("a disabled tracker does not become an active column, even if pinned", () => {
    const columns = filterPinnedTrackerColumns(
      [
        buildDefinition({
          id: "def-3",
          isPinned: true,
          enabled: false
        })
      ]
    );

    expect(columns).toHaveLength(0);
  });
});
