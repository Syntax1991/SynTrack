import { beforeEach, describe, expect, it } from "vitest";
import { FakeTagRepository } from "./tag.fakes.js";
import { TagService } from "./tag.service.js";

let repository: FakeTagRepository;
let service: TagService;

beforeEach(() => {
  repository = new FakeTagRepository();
  service = new TagService(repository);

  repository.seedCharacter("char-1");
  repository.seedCharacter("char-2");
  repository.seedCharacter("char-3");
});

describe("TagService.bulkAssign", () => {
  it("adds a tag to multiple characters in one call", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await service.bulkAssign({
      characterIds: ["char-1", "char-2"],
      addTagIds: [raid.id],
      removeTagIds: []
    });

    const assignments =
      await service.listAllAssignments();

    expect(
      assignments.map((a) => a.characterId).sort()
    ).toEqual(["char-1", "char-2"]);
  });

  it("removes a tag from multiple characters in one call", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await service.assign("char-1", raid.id);
    await service.assign("char-2", raid.id);
    await service.assign("char-3", raid.id);

    await service.bulkAssign({
      characterIds: ["char-1", "char-2"],
      addTagIds: [],
      removeTagIds: [raid.id]
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toEqual([
      { characterId: "char-3", tagId: raid.id }
    ]);
  });

  it("adds one tag and removes a different tag in the same call", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    const alt = await service.create({
      name: "Alt"
    });

    await service.assign("char-1", alt.id);

    await service.bulkAssign({
      characterIds: ["char-1"],
      addTagIds: [raid.id],
      removeTagIds: [alt.id]
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toEqual([
      { characterId: "char-1", tagId: raid.id }
    ]);
  });

  it("handles multiple tags added to multiple characters", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    const mPlus = await service.create({
      name: "M+"
    });

    await service.bulkAssign({
      characterIds: ["char-1", "char-2"],
      addTagIds: [raid.id, mPlus.id],
      removeTagIds: []
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(4);
  });

  it("adding an already-assigned tag to some characters is idempotent, not an error", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await service.assign("char-1", raid.id);

    await service.bulkAssign({
      characterIds: ["char-1", "char-2"],
      addTagIds: [raid.id],
      removeTagIds: []
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(2);
  });

  it("removing a tag that some characters never had is harmless, not an error", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await service.assign("char-1", raid.id);

    await expect(
      service.bulkAssign({
        characterIds: ["char-1", "char-2"],
        addTagIds: [],
        removeTagIds: [raid.id]
      })
    ).resolves.toBeUndefined();

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(0);
  });

  it("rejects a request with a nonexistent character id and applies nothing", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await expect(
      service.bulkAssign({
        characterIds: ["char-1", "char-missing"],
        addTagIds: [raid.id],
        removeTagIds: []
      })
    ).rejects.toThrow("Characters not found");

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(0);
  });

  it("rejects a request with a nonexistent tag id and applies nothing", async () => {
    await expect(
      service.bulkAssign({
        characterIds: ["char-1"],
        addTagIds: ["tag-missing"],
        removeTagIds: []
      })
    ).rejects.toThrow("Tags not found");

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(0);
  });

  it("rejects the same tag appearing in both addTagIds and removeTagIds", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await expect(
      service.bulkAssign({
        characterIds: ["char-1"],
        addTagIds: [raid.id],
        removeTagIds: [raid.id]
      })
    ).rejects.toThrow(
      /cannot be both added and removed/
    );
  });

  it("rejects an empty character selection", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await expect(
      service.bulkAssign({
        characterIds: [],
        addTagIds: [raid.id],
        removeTagIds: []
      })
    ).rejects.toThrow(
      "At least one character must be selected."
    );
  });

  it("rejects a request with no tags to add or remove", async () => {
    await expect(
      service.bulkAssign({
        characterIds: ["char-1"],
        addTagIds: [],
        removeTagIds: []
      })
    ).rejects.toThrow(
      "At least one tag to add or remove must be provided."
    );
  });

  it("deduplicates repeated character/tag ids before applying", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    await service.bulkAssign({
      characterIds: ["char-1", "char-1"],
      addTagIds: [raid.id, raid.id],
      removeTagIds: []
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(1);
  });
});
