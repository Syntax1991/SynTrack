import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it
} from "vitest";
import { RaiderAuthRepository } from "./raider-auth.repository.js";

/*
 * Proves the two DB-level guarantees a fake/mock repository can never
 * actually demonstrate: the UNIQUE constraint on battleNetAccountId
 * (apps/api/prisma/migrations/20260830150000_add_raider_canonical_identity)
 * really exists in the live schema, and RaiderAuthRepository.createAccount
 * really is safe when two callers race to create the same canonical
 * identity concurrently - not just safe in a single-threaded fake.
 *
 * Runs the real migration chain against a throwaway SQLite file (deleted
 * in afterAll) rather than the app's dev.db, and points a fresh
 * RaiderAuthRepository at it via constructor injection.
 */

const moduleDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const apiRoot = path.resolve(
  moduleDirectory,
  "../../../../apps/api"
);

const prismaBinary = path.resolve(
  moduleDirectory,
  "../../../../node_modules/.bin/prisma" +
    (process.platform === "win32"
      ? ".cmd"
      : "")
);

let tempDir: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any;
let repository: RaiderAuthRepository;

beforeAll(async () => {
  tempDir = mkdtempSync(
    path.join(
      tmpdir(),
      "raider-auth-repo-test-"
    )
  );

  const databaseUrl = `file:${path.join(tempDir, "test.db").replace(/\\/gu, "/")}`;

  execFileSync(
    prismaBinary,
    [
      "migrate",
      "deploy"
    ],
    {
      cwd: apiRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl
      },
      stdio: "pipe",
      shell:
        process.platform === "win32"
    }
  );

  const { PrismaBetterSqlite3 } =
    await import(
      "@prisma/adapter-better-sqlite3"
    );

  const { PrismaClient } =
    await import(
      "../../../../apps/api/src/generated/prisma/client.js"
    );

  const adapter =
    new PrismaBetterSqlite3({
      url: databaseUrl
    });

  prisma = new PrismaClient({
    adapter
  });

  repository = new RaiderAuthRepository(
    prisma
  );
}, 60000);

afterAll(async () => {
  await prisma?.$disconnect();

  rmSync(tempDir, {
    recursive: true,
    force: true
  });
});

describe("RaiderAuthRepository — real SQLite database", () => {
  it("enforces canonical Battle.net identity uniqueness at the DB level - a raw duplicate insert is rejected", async () => {
    await prisma.raiderAccount.create({
      data: {
        battleNetAccountId:
          "dup-check-1",
        battleTag: "First#1"
      }
    });

    await expect(
      prisma.raiderAccount.create({
        data: {
          battleNetAccountId:
            "dup-check-1",
          battleTag: "Second#2"
        }
      })
    ).rejects.toThrow();
  });

  it("createAccount is concurrency-safe: two racing calls for the same canonical identity resolve to exactly one row", async () => {
    const battleNetAccountId =
      "race-check-1";

    const [first, second] =
      await Promise.all([
        repository.createAccount({
          battleNetAccountId,
          battleTag: "Racer#1"
        }),
        repository.createAccount({
          battleNetAccountId,
          battleTag: "Racer#1"
        })
      ]);

    expect(first.id).toBe(second.id);

    const rows =
      await prisma.raiderAccount.findMany(
        {
          where: {
            battleNetAccountId
          }
        }
      );

    expect(rows).toHaveLength(1);
  });

  it("createAccount concurrency safety holds under higher contention (10 racing calls)", async () => {
    const battleNetAccountId =
      "race-check-2";

    const results = await Promise.all(
      Array.from(
        { length: 10 },
        () =>
          repository.createAccount({
            battleNetAccountId,
            battleTag: "Racer#2"
          })
      )
    );

    const distinctIds = new Set(
      results.map((account) => account.id)
    );

    expect(distinctIds.size).toBe(1);

    const rows =
      await prisma.raiderAccount.findMany(
        {
          where: {
            battleNetAccountId
          }
        }
      );

    expect(rows).toHaveLength(1);
  });

  it("BattleTag is no longer unique at the DB level (it is a synced display field, not the dedup key) - two accounts may share one while canonical ids differ", async () => {
    await prisma.raiderAccount.create({
      data: {
        battleNetAccountId:
          "shared-tag-1",
        battleTag: "Shared#1"
      }
    });

    await expect(
      prisma.raiderAccount.create({
        data: {
          battleNetAccountId:
            "shared-tag-2",
          battleTag: "Shared#1"
        }
      })
    ).resolves.toBeDefined();
  });

  it("findAndBackfillLegacyAccountByBattleTag binds a pre-migration row concurrency-safely: two racing callbacks for the same legacy identity never produce two rows", async () => {
    const legacyAccount =
      await prisma.raiderAccount.create({
        data: {
          battleNetAccountId: null,
          battleTag: "LegacyRace#1"
        }
      });

    const [first, second] =
      await Promise.all([
        repository.findAndBackfillLegacyAccountByBattleTag(
          "LegacyRace#1",
          "legacy-race-canonical-1"
        ),
        repository.findAndBackfillLegacyAccountByBattleTag(
          "LegacyRace#1",
          "legacy-race-canonical-1"
        )
      ]);

    expect(first?.id).toBe(
      legacyAccount.id
    );

    expect(second?.id).toBe(
      legacyAccount.id
    );

    const rows =
      await prisma.raiderAccount.findMany(
        {
          where: {
            battleNetAccountId:
              "legacy-race-canonical-1"
          }
        }
      );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(
      legacyAccount.id
    );
  });

  it("consumePendingRegistration is single-use under concurrency - only one of two racing confirms observes the row", async () => {
    const token =
      "race-pending-token-1";

    await repository.createPendingRegistration(
      {
        token,
        battleNetAccountId:
          "pending-race-1",
        battleTag: "Pending#1",
        accessToken: "access-token",
        tokenType: "bearer",
        scope: null,
        tokenExpiresAt: new Date(
          Date.now() + 60_000
        ),
        charactersJson: "[]",
        expiresAt: new Date(
          Date.now() + 60_000
        )
      }
    );

    const [first, second] =
      await Promise.all([
        repository.consumePendingRegistration(
          token
        ),
        repository.consumePendingRegistration(
          token
        )
      ]);

    const successes = [
      first,
      second
    ].filter(
      (result) => result !== null
    );

    expect(successes).toHaveLength(1);
  });
});
