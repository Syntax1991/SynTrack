import { describe, expect, it } from "vitest";
import {
  resolveEmbellishmentOverviewState,
  resolveTierOverviewState
} from "./overview-tier-embellishment-state.mapper.js";

describe("resolveTierOverviewState / resolveEmbellishmentOverviewState", () => {
  it("always resolves NOT_TRACKED - no data source exists for tier-set-ness or embellishment identity yet", () => {
    expect(
      resolveTierOverviewState()
    ).toEqual({
      state: "NOT_TRACKED"
    });

    expect(
      resolveEmbellishmentOverviewState()
    ).toEqual({
      state: "NOT_TRACKED"
    });
  });
});
