import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ProfessionRepository } from "../../../professions/api/profession.repository.js";
import { CharacterRepository } from "./character.repository.js";
import { buildNameRealmCharacterKey } from "./character-identity.js";

/*
 * Throwaway SQLite only (never app dev.db). Prisma singleton redirected so
 * CharacterService exercises real transactions + cascades in isolation.
 */

const testDb = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: null as any
}));

vi.mock(
  "../../../../apps/api/src/infrastructure/database/prismaClient.js",
  () => ({
    get prisma() {
      if (!testDb.prisma) {
        throw new Error("test prisma not initialized");
      }
      return testDb.prisma;
    }
  })
);

const { CharacterService } = await import("./character.service.js");
const { RemovedCharacterRepository } = await import(
  "./removed-character.repository.js"
);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(moduleDirectory, "../../../../apps/api");
const prismaBinary = path.resolve(
  moduleDirectory,
  `../../../../node_modules/.bin/prisma${process.platform === "win32" ? ".cmd" : ""}`
);

let tempDir: string;
let service: InstanceType<typeof CharacterService>;
const removedRepo = new RemovedCharacterRepository();

beforeAll(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), "char-removal-"));
  const databaseUrl = `file:${path.join(tempDir, "test.db").replace(/\\/gu, "/")}`;

  execFileSync(prismaBinary, ["migrate", "deploy"], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
    shell: process.platform === "win32"
  });

  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const { PrismaClient } = await import(
    "../../../../apps/api/src/generated/prisma/client.js"
  );

  testDb.prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl })
  });
  service = new CharacterService(
    new CharacterRepository(),
    new ProfessionRepository()
  );
}, 60000);

afterAll(async () => {
  await testDb.prisma?.$disconnect();
  rmSync(tempDir, { recursive: true, force: true });
});

async function wipeFixtures() {
  const prisma = testDb.prisma;
  await prisma.characterTagAssignment.deleteMany();
  await prisma.characterGearSlot.deleteMany();
  await prisma.character.deleteMany();
  await prisma.removedCharacter.deleteMany();
  await prisma.characterTag.deleteMany();
  await prisma.raiderAccount.deleteMany();
}

beforeEach(wipeFixtures);
afterEach(wipeFixtures);

async function createAccount(label: string) {
  return testDb.prisma.raiderAccount.create({
    data: {
      battleNetAccountId: `test-rm-${label}`,
      battleTag: `${label}#0001`
    }
  });
}

async function createOwnedCharacter(
  accountId: string,
  name: string,
  realm: string
) {
  return testDb.prisma.character.create({
    data: {
      name,
      realm,
      region: "eu",
      className: "Shaman",
      level: 80,
      raiderAccountId: accountId
    }
  });
}

const synblastInput = {
  name: "Synblast",
  realm: "Antonidas",
  region: "eu",
  className: "Shaman",
  level: 80,
  professionIds: [] as string[]
};

async function expectNotFound(promise: Promise<unknown>) {
  try {
    await promise;
    expect.unreachable("expected 404");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(404);
  }
}

describe("CharacterService safe removal", () => {
  it("remove upserts RemovedCharacter then deletes Character", async () => {
    const account = await createAccount("owner-a");
    const character = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(character.id, account.id);

    expect(
      await testDb.prisma.character.findUnique({ where: { id: character.id } })
    ).toBeNull();

    const removed = await testDb.prisma.removedCharacter.findMany({
      where: { raiderAccountId: account.id }
    });
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({
      characterName: "Synblast",
      realmName: "Antonidas",
      region: "eu",
      stableCharacterKey: buildNameRealmCharacterKey(synblastInput)
    });
  });

  it("wrong account or missing id → 404 and no delete", async () => {
    const owner = await createAccount("owner");
    const other = await createAccount("other");
    const character = await createOwnedCharacter(
      owner.id,
      "Synblast",
      "Antonidas"
    );

    await expectNotFound(service.remove(character.id, other.id));
    expect(
      await testDb.prisma.character.findUnique({ where: { id: character.id } })
    ).not.toBeNull();

    await expectNotFound(service.remove("missing-id", owner.id));
    expect(await testDb.prisma.removedCharacter.count()).toBe(0);
  });

  it("repeated remove after gone → 404", async () => {
    const account = await createAccount("repeat");
    const character = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(character.id, account.id);
    await expectNotFound(service.remove(character.id, account.id));
  });

  it("restore deletes suppression; second restore of same id → 404", async () => {
    const account = await createAccount("restore");
    const character = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(character.id, account.id);
    const [row] = await testDb.prisma.removedCharacter.findMany({
      where: { raiderAccountId: account.id }
    });

    expect((await service.restore(row.id, account.id)).restored).toBe(true);
    expect(await testDb.prisma.removedCharacter.count()).toBe(0);
    await expectNotFound(service.restore(row.id, account.id));
  });

  it("create after suppress clears suppression (explicit add = restore)", async () => {
    const account = await createAccount("readd");
    const character = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(character.id, account.id);
    expect(await testDb.prisma.removedCharacter.count()).toBe(1);

    await service.create(synblastInput, account.id);

    expect(await testDb.prisma.removedCharacter.count()).toBe(0);
    expect(
      await testDb.prisma.character.findUnique({
        where: {
          name_realm_region: {
            name: "Synblast",
            realm: "Antonidas",
            region: "eu"
          }
        }
      })
    ).not.toBeNull();
  });

  it("account isolation: Account A suppress does not affect Account B", async () => {
    const accountA = await createAccount("a");
    const accountB = await createAccount("b");
    const character = await createOwnedCharacter(
      accountA.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(character.id, accountA.id);

    expect(await removedRepo.isSuppressed(accountA.id, synblastInput)).toBe(
      true
    );
    expect(await removedRepo.isSuppressed(accountB.id, synblastInput)).toBe(
      false
    );

    const forB = await createOwnedCharacter(accountB.id, "Synblast", "Antonidas");
    expect(forB.raiderAccountId).toBe(accountB.id);
  });

  it("realm isolation: Antonidas removal does not block Blackhand", async () => {
    const account = await createAccount("realm");
    const antonidas = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await service.remove(antonidas.id, account.id);
    await service.create(
      { ...synblastInput, realm: "Blackhand" },
      account.id
    );

    expect(
      await testDb.prisma.character.findUnique({
        where: {
          name_realm_region: {
            name: "Synblast",
            realm: "Blackhand",
            region: "eu"
          }
        }
      })
    ).not.toBeNull();

    expect(
      await removedRepo.isSuppressed(account.id, {
        name: "Synblast",
        realm: "Blackhand",
        region: "eu"
      })
    ).toBe(false);
  });

  it("cascade: assignment/gear gone; tag definition and account remain", async () => {
    const account = await createAccount("cascade");
    const tag = await testDb.prisma.characterTag.create({
      data: { name: "rm-cascade-tag" }
    });
    const character = await createOwnedCharacter(
      account.id,
      "Synblast",
      "Antonidas"
    );

    await testDb.prisma.characterTagAssignment.create({
      data: { characterId: character.id, tagId: tag.id }
    });
    await testDb.prisma.characterGearSlot.create({
      data: { characterId: character.id, slotKey: "HEAD" }
    });

    await service.remove(character.id, account.id);

    expect(
      await testDb.prisma.characterTagAssignment.count({
        where: { characterId: character.id }
      })
    ).toBe(0);
    expect(
      await testDb.prisma.characterGearSlot.count({
        where: { characterId: character.id }
      })
    ).toBe(0);
    expect(
      await testDb.prisma.characterTag.findUnique({ where: { id: tag.id } })
    ).not.toBeNull();
    expect(
      await testDb.prisma.raiderAccount.findUnique({ where: { id: account.id } })
    ).not.toBeNull();
  });
});
