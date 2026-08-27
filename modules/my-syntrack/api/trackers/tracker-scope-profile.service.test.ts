import { beforeEach, describe, expect, it } from "vitest";
import { FakeTrackerScopeProfileRepository } from "./tracker-scope-profile.fakes.js";
import { TrackerScopeProfileService } from "./tracker-scope-profile.service.js";

let repository: FakeTrackerScopeProfileRepository;
let service: TrackerScopeProfileService;

beforeEach(() => {
  repository =
    new FakeTrackerScopeProfileRepository();

  service = new TrackerScopeProfileService(
    repository
  );

  repository.seed({
    key: "MIDNIGHT-S1",
    name: "Midnight Season 1",
    isActive: true
  });
});

describe("TrackerScopeProfileService", () => {
  it("reports the seeded active profile", async () => {
    const active =
      await service.getActive();

    expect(active?.key).toBe(
      "MIDNIGHT-S1"
    );
  });

  it("normalizes a new profile's key the same way tracker definitions already do", async () => {
    const created = await service.create(
      {
        key: "midnight s2",
        name: "Midnight Season 2"
      }
    );

    expect(created.key).toBe(
      "MIDNIGHT-S2"
    );

    expect(created.isActive).toBe(
      false
    );
  });

  it("rejects creating a profile whose normalized key already exists", async () => {
    await expect(
      service.create({
        key: "midnight-s1",
        name: "Duplicate"
      })
    ).rejects.toThrow(
      /already exists/
    );
  });

  it("switching the active profile deactivates the previous one - exactly one profile stays active", async () => {
    await service.create({
      key: "MIDNIGHT-S2",
      name: "Midnight Season 2"
    });

    await service.setActive(
      "MIDNIGHT-S2"
    );

    const profiles =
      await service.list();

    const activeProfiles =
      profiles.filter(
        (profile) => profile.isActive
      );

    expect(activeProfiles).toHaveLength(
      1
    );

    expect(
      activeProfiles[0]?.key
    ).toBe("MIDNIGHT-S2");
  });

  it("switching season never deletes or renames historical profiles - MIDNIGHT-S1 remains listed", async () => {
    await service.create({
      key: "MIDNIGHT-S2",
      name: "Midnight Season 2"
    });

    await service.setActive(
      "MIDNIGHT-S2"
    );

    const profiles =
      await service.list();

    expect(
      profiles.map((p) => p.key)
    ).toContain("MIDNIGHT-S1");
  });

  it("throws 404 when activating a key that does not exist", async () => {
    await expect(
      service.setActive(
        "DOES-NOT-EXIST"
      )
    ).rejects.toThrow(
      "Tracker scope profile not found."
    );
  });
});
