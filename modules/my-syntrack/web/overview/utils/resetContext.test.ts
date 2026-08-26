import { describe, expect, it } from "vitest";
import { formatResetCountdown } from "./resetContext";

describe("formatResetCountdown", () => {
  it("formats days and hours remaining", () => {
    const now = new Date(
      "2026-08-26T07:00:00.000Z"
    );

    const endsAt =
      "2026-09-02T07:00:00.000Z";

    expect(
      formatResetCountdown(
        endsAt,
        now
      )
    ).toBe("Reset in 7d 0h");
  });

  it("drops the day count once under 24h remaining", () => {
    const now = new Date(
      "2026-09-02T02:00:00.000Z"
    );

    const endsAt =
      "2026-09-02T07:00:00.000Z";

    expect(
      formatResetCountdown(
        endsAt,
        now
      )
    ).toBe("Reset in 5h");
  });

  it("shows minutes once under 1h remaining", () => {
    const now = new Date(
      "2026-09-02T06:45:00.000Z"
    );

    const endsAt =
      "2026-09-02T07:00:00.000Z";

    expect(
      formatResetCountdown(
        endsAt,
        now
      )
    ).toBe("Reset in 15m");
  });

  it("reports the reset as available once the instant has passed", () => {
    const now = new Date(
      "2026-09-02T08:00:00.000Z"
    );

    const endsAt =
      "2026-09-02T07:00:00.000Z";

    expect(
      formatResetCountdown(
        endsAt,
        now
      )
    ).toBe("Reset available");
  });
});
