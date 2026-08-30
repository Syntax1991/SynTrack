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

  it("defaults to no intent parameter (the backend treats a missing intent as login, never auto-registering)", () => {
    expect(
      getRaiderLoginUrl()
    ).not.toContain("intent=");
  });

  it("adds intent=register only when explicitly requested", () => {
    expect(
      getRaiderLoginUrl({
        intent: "register"
      })
    ).toContain("intent=register");
  });

  it("forwards a safe internal returnTo", () => {
    expect(
      getRaiderLoginUrl({
        returnTo: "/characters"
      })
    ).toContain(
      "returnTo=%2Fcharacters"
    );
  });

  it("drops an unsafe returnTo instead of forwarding it", () => {
    expect(
      getRaiderLoginUrl({
        returnTo:
          "https://evil.example.com"
      })
    ).not.toContain("evil.example.com");
  });
});
