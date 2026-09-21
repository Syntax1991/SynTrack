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
import { ProfessionRepository } from "../../../professions/api/profession.repository.js";
import { CharacterRepository } from "./character.repository.js";
import { buildNameRealmCharacterKey } from "./character-identity.js";

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

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(moduleDirectory, "../../../../apps/api");
const prismaBinary = path.resolve(
  moduleDirectory,
  `../../../../node_modules/.bin/prisma${process.platform === "win32" ? ".cmd" : ""}`
);

let tempDir: string;
let service: InstanceType<typeof CharacterService>;

beforeAll(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), "char-removal-own-"));
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

describe("CharacterService removal ownership edge cases", () => {
  it("removes orphan characters with null raiderAccountId for the acting account", async () => {
    const account = await testDb.prisma.raiderAccount.create({
      data: {
        battleNetAccountId: "test-rm-orphan",
        battleTag: "Orphan#0001"
      }
    });
    const orphan = await testDb.prisma.character.create({
      data: {
        name: "Synbank",
        realm: "Draenor",
        region: "eu",
        className: "Warrior",
        level: 10,
        raiderAccountId: null
      }
    });

    await service.remove(orphan.id, account.id);

    expect(
      await testDb.prisma.character.findUnique({ where: { id: orphan.id } })
    ).toBeNull();

    const removed = await testDb.prisma.removedCharacter.findMany({
      where: { raiderAccountId: account.id }
    });
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({
      characterName: "Synbank",
      realmName: "Draenor",
      region: "eu",
      stableCharacterKey: buildNameRealmCharacterKey({
        name: "Synbank",
        realm: "Draenor",
        region: "eu"
      })
    });
  });

  it("create assigns raiderAccountId so the character can later be removed", async () => {
    const account = await testDb.prisma.raiderAccount.create({
      data: {
        battleNetAccountId: "test-rm-create-owner",
        battleTag: "Create#0001"
      }
    });

    const created = await service.create(
      {
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        className: "Shaman",
        level: 80,
        professionIds: []
      },
      account.id
    );

    expect(created.raiderAccountId).toBe(account.id);

    await service.remove(created.id, account.id);
    expect(
      await testDb.prisma.character.findUnique({ where: { id: created.id } })
    ).toBeNull();
    expect(await testDb.prisma.removedCharacter.count()).toBe(1);
  });
});
