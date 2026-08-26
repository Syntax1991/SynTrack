import { describe, expect, it } from "vitest";
import type { CharacterTrackerState } from "../types/overview.types";
import { formatTrackerToken } from "./trackerCellFormatting";

function buildState(
  overrides: Partial<CharacterTrackerState>
): CharacterTrackerState {
  return {
    trackerDefinitionId: "tracker-1",
    characterId: "char-1",
    periodKey: "ALWAYS",
    state: "RECORDED",
    source: "MANUAL",
    value: null,
    ...overrides
  };
}

describe("formatTrackerToken", () => {
  it("renders an unrecorded (no row) tracker as '?' / unknown, distinct from an explicit false", () => {
    expect(
      formatTrackerToken(undefined)
    ).toEqual({
      symbol: "?",
      tone: "unknown",
      title: "Not recorded yet"
    });
  });

  it("renders a state whose backend status is UNKNOWN as '?' / unknown even if a stale value is present", () => {
    const token = formatTrackerToken(
      buildState({ state: "UNKNOWN" })
    );

    expect(token.symbol).toBe("?");
    expect(token.tone).toBe("unknown");
  });

  it("renders BOOLEAN true as a restrained checkmark, distinct in tone from BOOLEAN false", () => {
    const trueToken = formatTrackerToken(
      buildState({
        value: {
          valueType: "BOOLEAN",
          boolean: true
        }
      })
    );

    const falseToken = formatTrackerToken(
      buildState({
        value: {
          valueType: "BOOLEAN",
          boolean: false
        }
      })
    );

    expect(trueToken).toEqual({
      symbol: "✓",
      tone: "ready",
      title: "Complete"
    });

    expect(falseToken).toEqual({
      symbol: "○",
      tone: "attention",
      title: "Explicitly incomplete"
    });

    expect(trueToken.symbol).not.toBe(falseToken.symbol);
    expect(trueToken.tone).not.toBe(falseToken.tone);
  });

  it("renders PROGRESS as current/total, ready once complete", () => {
    expect(
      formatTrackerToken(
        buildState({
          value: {
            valueType: "PROGRESS",
            current: 2,
            total: 4
          }
        })
      )
    ).toEqual({
      symbol: "2/4",
      tone: "progress",
      title: "2 of 4"
    });

    expect(
      formatTrackerToken(
        buildState({
          value: {
            valueType: "PROGRESS",
            current: 4,
            total: 4
          }
        })
      ).tone
    ).toBe("ready");
  });

  it("renders NUMBER as the raw value", () => {
    expect(
      formatTrackerToken(
        buildState({
          value: {
            valueType: "NUMBER",
            number: 12
          }
        })
      )
    ).toEqual({
      symbol: "12",
      tone: "progress",
      title: "12"
    });
  });

  it("renders TEXT as-is when short, and safely truncates with the full value in the title when long", () => {
    expect(
      formatTrackerToken(
        buildState({
          value: {
            valueType: "TEXT",
            text: "short"
          }
        })
      )
    ).toEqual({
      symbol: "short",
      tone: "progress",
      title: "short"
    });

    const longText =
      "this is a much longer note than fits in a cell";

    const token = formatTrackerToken(
      buildState({
        value: {
          valueType: "TEXT",
          text: longText
        }
      })
    );

    expect(token.symbol).toBe(
      "this is a …"
    );

    expect(token.symbol.length).toBeLessThan(
      longText.length
    );

    expect(token.title).toBe(longText);
  });
});
