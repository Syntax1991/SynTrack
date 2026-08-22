import { describe, expect, it } from "vitest";
import { getRaiderLoginUrl } from "./raiderAuthApi";

describe("getRaiderLoginUrl", () => {
  it("resolves to the Raider Login OAuth connect route", () => {
    expect(getRaiderLoginUrl()).toMatch(
      /\/auth\/raider\/connect$/
    );
  });

  it("is a different route than the owner Battle.net sync machinery", () => {
    expect(
      getRaiderLoginUrl()
    ).not.toContain(
      "/integrations/battlenet"
    );
  });
});
