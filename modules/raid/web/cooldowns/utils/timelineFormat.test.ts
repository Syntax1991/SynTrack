import { describe, expect, it } from "vitest";
import {
  formatRelativeTime,
  formatSeconds,
  getWowIconUrl,
  groupCastsByAbility,
  isAssignedMemberInLineup,
  parseTimeInput,
  percentOf,
  planningDurationSeconds,
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

describe("planningDurationSeconds", () => {
  it("is 7:00", () => {
    expect(
      planningDurationSeconds
    ).toBe(420);

    expect(
      formatSeconds(
        planningDurationSeconds
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
