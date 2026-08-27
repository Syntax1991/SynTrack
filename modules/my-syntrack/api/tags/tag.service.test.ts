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
});

describe("TagService", () => {
  it("trims whitespace when creating a tag", async () => {
    const tag = await service.create({
      name: "  Raid  "
    });

    expect(tag.name).toBe("Raid");
  });

  it("prevents case-insensitive cosmetic duplicates", async () => {
    await service.create({ name: "Raid" });

    await expect(
      service.create({ name: "raid" })
    ).rejects.toThrow(
      /already exists/
    );

    await expect(
      service.create({ name: " RAID " })
    ).rejects.toThrow(
      /already exists/
    );
  });

  it("allows renaming a tag to a name it already owns (no-op case)", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    const renamed = await service.update(
      tag.id,
      { name: "Raid" }
    );

    expect(renamed.name).toBe("Raid");
  });

  it("rejects renaming a tag to another existing tag's name, case-insensitively", async () => {
    await service.create({ name: "Raid" });
    const alt = await service.create({
      name: "Alt"
    });

    await expect(
      service.update(alt.id, {
        name: "raid"
      })
    ).rejects.toThrow(
      /already exists/
    );
  });

  it("preserves assignments across a rename", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await service.assign(
      "char-1",
      tag.id
    );

    await service.update(tag.id, {
      name: "Raiding"
    });

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toContainEqual({
      characterId: "char-1",
      tagId: tag.id
    });
  });

  it("deleting a tag removes its assignments but never characters", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await service.assign(
      "char-1",
      tag.id
    );

    await service.delete(tag.id);

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(0);

    expect(
      await repository.findCharacterExists(
        "char-1"
      )
    ).toBe(true);
  });

  it("assigns the same tag to multiple characters (many-to-many)", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await service.assign(
      "char-1",
      tag.id
    );

    await service.assign(
      "char-2",
      tag.id
    );

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(2);
  });

  it("a character can hold multiple tags", async () => {
    const raid = await service.create({
      name: "Raid"
    });

    const mPlus = await service.create({
      name: "M+"
    });

    await service.assign(
      "char-1",
      raid.id
    );

    await service.assign(
      "char-1",
      mPlus.id
    );

    const assignments =
      await service.listAllAssignments();

    expect(
      assignments.filter(
        (a) =>
          a.characterId === "char-1"
      )
    ).toHaveLength(2);
  });

  it("assigning the same tag twice is idempotent", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await service.assign(
      "char-1",
      tag.id
    );

    await service.assign(
      "char-1",
      tag.id
    );

    const assignments =
      await service.listAllAssignments();

    expect(assignments).toHaveLength(1);
  });

  it("unassigning a tag that was never assigned does not throw", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await expect(
      service.unassign(
        "char-1",
        tag.id
      )
    ).resolves.toBeUndefined();
  });

  it("throws 404 when assigning a nonexistent tag", async () => {
    await expect(
      service.assign(
        "char-1",
        "missing-tag"
      )
    ).rejects.toThrow(
      "Tag not found."
    );
  });

  it("throws 404 when assigning to a nonexistent character", async () => {
    const tag = await service.create({
      name: "Raid"
    });

    await expect(
      service.assign(
        "char-missing",
        tag.id
      )
    ).rejects.toThrow(
      "Character not found."
    );
  });
});
