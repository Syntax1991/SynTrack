import { afterEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock(
  "../../../../apps/api/src/infrastructure/database/prismaClient.js",
  () => ({
    prisma: {
      characterExternalSnapshot: {
        upsert: (...args: unknown[]) => upsertMock(...args),
        findUnique: (...args: unknown[]) => findUniqueMock(...args)
      }
    }
  })
);

const { CharacterExternalSnapshotRepository } = await import(
  "./character-external-snapshot.repository.js"
);
const { EXTERNAL_DOMAIN_EQUIPMENT, EXTERNAL_SOURCE_BLIZZARD } = await import(
  "./character-external-sync.types.js"
);

afterEach(() => {
  upsertMock.mockReset();
  findUniqueMock.mockReset();
});

describe("CharacterExternalSnapshotRepository", () => {
  it("recordSuccess writes payloadJson and fetchedAt together", async () => {
    const repository = new CharacterExternalSnapshotRepository();

    await repository.recordSuccess(
      "char-1",
      EXTERNAL_SOURCE_BLIZZARD,
      EXTERNAL_DOMAIN_EQUIPMENT,
      { averageItemLevel: 315, slots: [] }
    );

    const call = upsertMock.mock.calls[0]![0] as {
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    };

    expect(call.update.lastStatus).toBe("SUCCESS");
    expect(call.update.fetchedAt).toBeInstanceOf(Date);
    expect(JSON.parse(call.update.payloadJson as string)).toEqual({
      averageItemLevel: 315,
      slots: []
    });
  });

  it("recordFailure never touches payloadJson or fetchedAt in its update clause", async () => {
    const repository = new CharacterExternalSnapshotRepository();

    await repository.recordFailure(
      "char-1",
      EXTERNAL_SOURCE_BLIZZARD,
      EXTERNAL_DOMAIN_EQUIPMENT,
      "Blizzard 503"
    );

    const call = upsertMock.mock.calls[0]![0] as {
      update: Record<string, unknown>;
    };

    expect(call.update.lastStatus).toBe("FAILED");
    expect(call.update).not.toHaveProperty("payloadJson");
    expect(call.update).not.toHaveProperty("fetchedAt");
  });

  it("truncates an overly long error message before persisting it", async () => {
    const repository = new CharacterExternalSnapshotRepository();
    const longMessage = "x".repeat(1000);

    await repository.recordFailure(
      "char-1",
      EXTERNAL_SOURCE_BLIZZARD,
      EXTERNAL_DOMAIN_EQUIPMENT,
      longMessage
    );

    const call = upsertMock.mock.calls[0]![0] as {
      update: { lastError: string };
    };

    expect(call.update.lastError.length).toBeLessThanOrEqual(300);
  });

  it("findOne parses the stored payload back into an object", async () => {
    findUniqueMock.mockResolvedValue({
      characterId: "char-1",
      source: "BLIZZARD",
      domain: "EQUIPMENT",
      payloadJson: JSON.stringify({ averageItemLevel: 320, slots: [] }),
      fetchedAt: new Date("2026-09-04T00:00:00.000Z"),
      lastAttemptAt: new Date("2026-09-04T00:00:00.000Z"),
      lastStatus: "SUCCESS",
      lastError: null
    });

    const repository = new CharacterExternalSnapshotRepository();
    const record = await repository.findOne(
      "char-1",
      EXTERNAL_SOURCE_BLIZZARD,
      EXTERNAL_DOMAIN_EQUIPMENT
    );

    expect(record?.payload).toEqual({ averageItemLevel: 320, slots: [] });
    expect(record?.lastStatus).toBe("SUCCESS");
  });

  it("findOne returns null when no snapshot has ever been recorded", async () => {
    findUniqueMock.mockResolvedValue(null);

    const repository = new CharacterExternalSnapshotRepository();
    const record = await repository.findOne(
      "char-1",
      EXTERNAL_SOURCE_BLIZZARD,
      EXTERNAL_DOMAIN_EQUIPMENT
    );

    expect(record).toBeNull();
  });
});
