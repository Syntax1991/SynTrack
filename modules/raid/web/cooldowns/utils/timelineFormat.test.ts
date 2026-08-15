import { describe, expect, it } from "vitest";
import {
  defaultFightDurationSeconds,
  derivePhaseSegments,
  formatRelativeTime,
  formatSeconds,
  getWowIconUrl,
  groupCastsByAbility,
  isAssignedMemberInLineup,
  parseTimeInput,
  percentOf,
  resolveActivePhase,
  secondsFromClickX
} from "./timelineFormat.js";

function trackElement(
  left: number,
  width: number
): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      left,
      width,
      right: left + width,
      top: 0,
      bottom: 0,
      height: 0,
      x: left,
      y: 0,
      toJSON: () => ({})
    })
  } as unknown as HTMLElement;
}

describe("formatSeconds", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatSeconds(0)).toBe("0:00");
    expect(formatSeconds(65)).toBe("1:05");
    expect(formatSeconds(600)).toBe("10:00");
  });
});

describe("parseTimeInput", () => {
  it("parses mm:ss", () => {
    expect(parseTimeInput("1:05")).toBe(65);
  });

  it("parses bare seconds", () => {
    expect(parseTimeInput("42")).toBe(42);
  });

  it("clamps negative values to 0", () => {
    expect(parseTimeInput("-5")).toBe(0);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseTimeInput("")).toBeNull();
    expect(parseTimeInput("abc")).toBeNull();
    expect(parseTimeInput("1:2:3")).toBeNull();
  });
});

describe("percentOf", () => {
  it("computes a percentage of the fight duration", () => {
    expect(percentOf(30, 120)).toBe(25);
  });

  it("clamps to 0-100", () => {
    expect(percentOf(-10, 120)).toBe(0);
    expect(percentOf(200, 120)).toBe(100);
  });

  it("returns 0 when fight duration is 0", () => {
    expect(percentOf(30, 0)).toBe(0);
  });
});

describe("secondsFromClickX", () => {
  it("maps a click position to seconds along the track", () => {
    const track = trackElement(0, 200);

    expect(
      secondsFromClickX(100, track, 120)
    ).toBe(60);
  });

  it("clamps clicks outside the track bounds", () => {
    const track = trackElement(0, 200);

    expect(
      secondsFromClickX(-50, track, 120)
    ).toBe(0);

    expect(
      secondsFromClickX(500, track, 120)
    ).toBe(120);
  });

  it("returns 0 for a zero-width track", () => {
    const track = trackElement(0, 0);

    expect(
      secondsFromClickX(50, track, 120)
    ).toBe(0);
  });
});

describe("groupCastsByAbility", () => {
  it("groups casts by ability name, ordered by first occurrence", () => {
    const rows = groupCastsByAbility([
      { abilityName: "B", timestampSeconds: 30 },
      { abilityName: "A", timestampSeconds: 10 },
      { abilityName: "B", timestampSeconds: 20 }
    ]);

    expect(
      rows.map((row) => row.abilityName)
    ).toEqual(["A", "B"]);

    expect(
      rows[1]?.casts.map(
        (cast) => cast.timestampSeconds
      )
    ).toEqual([20, 30]);
  });

  it("returns an empty array for no casts", () => {
    expect(
      groupCastsByAbility([])
    ).toEqual([]);
  });
});

describe("getWowIconUrl", () => {
  it("appends .jpg when the icon has no extension", () => {
    expect(
      getWowIconUrl("spell_holy_auramastery")
    ).toBe(
      "https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auramastery.jpg"
    );
  });

  it("does not double-append .jpg when already present", () => {
    expect(
      getWowIconUrl("spell_holy_auramastery.jpg")
    ).toBe(
      "https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auramastery.jpg"
    );
  });
});

describe("isAssignedMemberInLineup", () => {
  it("is true when the member is in the current lineup", () => {
    expect(
      isAssignedMemberInLineup(
        "member-1",
        new Set(["member-1"])
      )
    ).toBe(true);
  });

  it("is false when the member has fallen out of the lineup", () => {
    expect(
      isAssignedMemberInLineup(
        "member-1",
        new Set(["member-2"])
      )
    ).toBe(false);
  });
});

describe("derivePhaseSegments", () => {
  it("returns no segments when there are no real phase markers", () => {
    expect(
      derivePhaseSegments([], 420)
    ).toEqual([]);
  });

  it("derives start/end/duration from adjacent markers, ending the final phase at the fight duration", () => {
    const segments = derivePhaseSegments(
      [
        { label: "Phase 1", startSeconds: 0 },
        { label: "Phase 2", startSeconds: 102 },
        { label: "Phase 3", startSeconds: 229 }
      ],
      420
    );

    expect(segments).toEqual([
      {
        label: "Phase 1",
        startSeconds: 0,
        endSeconds: 102,
        durationSeconds: 102
      },
      {
        label: "Phase 2",
        startSeconds: 102,
        endSeconds: 229,
        durationSeconds: 127
      },
      {
        label: "Phase 3",
        startSeconds: 229,
        endSeconds: 420,
        durationSeconds: 191
      }
    ]);
  });

  it("sorts markers by start time regardless of input order", () => {
    const segments = derivePhaseSegments(
      [
        { label: "Phase 2", startSeconds: 100 },
        { label: "Phase 1", startSeconds: 0 }
      ],
      200
    );

    expect(
      segments.map((segment) => segment.label)
    ).toEqual(["Phase 1", "Phase 2"]);
  });

  it("a single real marker still produces one segment ending at the fight duration", () => {
    expect(
      derivePhaseSegments(
        [{ label: "Phase 1", startSeconds: 0 }],
        300
      )
    ).toEqual([
      {
        label: "Phase 1",
        startSeconds: 0,
        endSeconds: 300,
        durationSeconds: 300
      }
    ]);
  });
});

describe("resolveActivePhase", () => {
  const segments = derivePhaseSegments(
    [
      { label: "Phase 1", startSeconds: 0 },
      { label: "Phase 2", startSeconds: 102 },
      { label: "Phase 3", startSeconds: 229 }
    ],
    420
  );

  it("resolves a timestamp to the segment containing it", () => {
    expect(
      resolveActivePhase(54, segments)?.label
    ).toBe("Phase 1");

    expect(
      resolveActivePhase(102, segments)?.label
    ).toBe("Phase 2");

    expect(
      resolveActivePhase(300, segments)?.label
    ).toBe("Phase 3");
  });

  it("resolves a timestamp exactly at the fight end to the final segment", () => {
    expect(
      resolveActivePhase(420, segments)?.label
    ).toBe("Phase 3");
  });

  it("never guesses a phase for a timestamp before the first real marker", () => {
    const laterStart = derivePhaseSegments(
      [{ label: "Phase 2", startSeconds: 90 }],
      420
    );

    expect(
      resolveActivePhase(30, laterStart)
    ).toBeNull();
  });

  it("returns null when there are no real phase segments at all", () => {
    expect(
      resolveActivePhase(54, [])
    ).toBeNull();
  });
});

describe("defaultFightDurationSeconds", () => {
  it("is 7:00", () => {
    expect(
      defaultFightDurationSeconds
    ).toBe(420);

    expect(
      formatSeconds(
        defaultFightDurationSeconds
      )
    ).toBe("7:00");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-15T12:00:00Z");

  it("reports just now for sub-minute durations", () => {
    expect(
      formatRelativeTime(
        "2026-08-15T11:59:30Z",
        now
      )
    ).toBe("just now");
  });

  it("reports minutes ago", () => {
    expect(
      formatRelativeTime(
        "2026-08-15T11:45:00Z",
        now
      )
    ).toBe("15m ago");
  });

  it("reports hours ago", () => {
    expect(
      formatRelativeTime(
        "2026-08-15T09:00:00Z",
        now
      )
    ).toBe("3h ago");
  });

  it("reports days ago", () => {
    expect(
      formatRelativeTime(
        "2026-08-12T12:00:00Z",
        now
      )
    ).toBe("3d ago");
  });
});
