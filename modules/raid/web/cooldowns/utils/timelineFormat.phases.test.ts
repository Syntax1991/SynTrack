import { describe, expect, it } from "vitest";
import {
  derivePhaseSegments,
  resolveActivePhase
} from "./timelineFormat.js";

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

  it("prepends an implicit Phase 1 covering 0 up to the first real marker", () => {
    const segments = derivePhaseSegments(
      [
        { label: "Phase 2", startSeconds: 31 },
        { label: "Phase 3", startSeconds: 94 }
      ],
      420
    );

    expect(segments).toEqual([
      {
        label: "Phase 1",
        startSeconds: 0,
        endSeconds: 31,
        durationSeconds: 31
      },
      {
        label: "Phase 2",
        startSeconds: 31,
        endSeconds: 94,
        durationSeconds: 63
      },
      {
        label: "Phase 3",
        startSeconds: 94,
        endSeconds: 420,
        durationSeconds: 326
      }
    ]);
  });

  it("does not double up an implicit Phase 1 when a real marker already starts at 0", () => {
    const segments = derivePhaseSegments(
      [{ label: "Phase 1", startSeconds: 0 }],
      420
    );

    expect(
      segments.filter(
        (segment) => segment.startSeconds === 0
      )
    ).toHaveLength(1);
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

  it("resolves a timestamp before the first real marker to the implicit Phase 1", () => {
    const laterStart = derivePhaseSegments(
      [{ label: "Phase 2", startSeconds: 90 }],
      420
    );

    expect(
      resolveActivePhase(30, laterStart)?.label
    ).toBe("Phase 1");
  });

  it("returns null when there are no real phase segments at all", () => {
    expect(
      resolveActivePhase(54, [])
    ).toBeNull();
  });
});
