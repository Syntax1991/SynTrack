import { describe, expect, it } from "vitest";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import {
  NON_WEEKLY_TRACKER_PERIOD_KEY,
  resolveTrackerPeriodKey
} from "./tracker-period.js";

describe("resolveTrackerPeriodKey", () => {
  it("WEEKLY resolves to the same key getWeeklyPeriod already produces", () => {
    const now = new Date(
      "2026-08-27T12:00:00.000Z"
    );

    expect(
      resolveTrackerPeriodKey(
        "WEEKLY",
        now
      )
    ).toBe(getWeeklyPeriod(now).key);
  });

  it("SEASONAL resolves to the central non-weekly sentinel", () => {
    expect(
      resolveTrackerPeriodKey("SEASONAL")
    ).toBe(
      NON_WEEKLY_TRACKER_PERIOD_KEY
    );
  });

  it("does not reset seasonal evidence at a weekly boundary", () => {
    expect(
      resolveTrackerPeriodKey(
        "SEASONAL",
        new Date("2026-08-26T08:00:00.000Z")
      )
    ).toBe(
      resolveTrackerPeriodKey(
        "SEASONAL",
        new Date("2026-09-02T08:00:00.000Z")
      )
    );
  });

  it("PERMANENT resolves to the same central non-weekly sentinel", () => {
    expect(
      resolveTrackerPeriodKey(
        "PERMANENT"
      )
    ).toBe(
      NON_WEEKLY_TRACKER_PERIOD_KEY
    );
  });

  it("WEEKLY produces a different key across a reset boundary, never the ALWAYS sentinel", () => {
    const weekOne = new Date(
      "2026-08-26T08:00:00.000Z"
    );

    const weekTwo = new Date(
      "2026-09-02T08:00:00.000Z"
    );

    const keyOne = resolveTrackerPeriodKey(
      "WEEKLY",
      weekOne
    );

    const keyTwo = resolveTrackerPeriodKey(
      "WEEKLY",
      weekTwo
    );

    expect(keyOne).not.toBe(keyTwo);
    expect(keyOne).not.toBe(
      NON_WEEKLY_TRACKER_PERIOD_KEY
    );
    expect(keyTwo).not.toBe(
      NON_WEEKLY_TRACKER_PERIOD_KEY
    );
  });
});
