import { describe, expect, it, vi } from "vitest";
import { GuildAuditService } from "./audit.service.js";

const members = [
  { id: "member-1", name: "Synbeam", realm: "Antonidas" }
];

function createHarness() {
  const ensureVerified = vi.fn(async () => {});
  const requireSession = vi.fn(async () => ({
    token: "session-token",
    raiderAccountId: "raider-1",
    characters: [],
    returnTo: null
  }));
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterEquipment = vi.fn(async () => ({ equipped_items: [] }));
  const findAllMembers = vi.fn(async () => members);
  const updateAudit = vi.fn(async () => {});
  const replaceGearSlots = vi.fn(async () => {});

  const service = new GuildAuditService(
    { findAllMembers, updateAudit, replaceGearSlots } as never,
    { getCharacterEquipment } as never,
    { ensureVerified } as never,
    { requireSession } as never,
    { getAccessToken } as never
  );

  return {
    service,
    ensureVerified,
    requireSession,
    getAccessToken,
    getCharacterEquipment
  };
}

describe("GuildAuditService.refreshAll token flow", () => {
  it("fetches Blizzard equipment using the app token, not a user OAuth access token", async () => {
    const harness = createHarness();

    await harness.service.refreshAll("session-token");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterEquipment).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synbeam"
    );
  });

  it("authenticates the caller via requireSession, never requireUsableAccessToken", async () => {
    const harness = createHarness();

    await harness.service.refreshAll("session-token");

    expect(harness.requireSession).toHaveBeenCalledWith("session-token");
    // Structural: the injected raiderAuth fake only implements
    // requireSession, so if refreshAll ever called
    // requireUsableAccessToken instead it would throw "not a function"
    // rather than silently pass.
  });

  it("still requires guild verification before doing anything", async () => {
    const harness = createHarness();

    await harness.service.refreshAll("session-token");

    expect(harness.ensureVerified).toHaveBeenCalledTimes(1);
  });
});
