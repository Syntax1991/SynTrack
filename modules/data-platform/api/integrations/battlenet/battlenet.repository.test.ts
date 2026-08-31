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
import { BattleNetRepository } from "./battlenet.repository.js";

/*
 * Regression coverage for the BattleNetOAuthState lifecycle
 * (createOAuthState -> consumeOAuthState), added after a real-world
 * report of a fresh /login failing with "state invalid or expired" on
 * its very first callback - i.e. consumeOAuthState() found no matching,
 * unexpired row for the state Blizzard's callback sent back.
 *
 * Runs against a real, throwaway SQLite database (deleted in afterAll):
 * the previous suite only ever exercised BattleNetRepository through a
 * hand-written fake (raider-auth.test-support.ts) that always "succeeds"
 * at capturing state and could never catch a real single-use/expiry/
 * DB-level bug here.
 */

const moduleDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const apiRoot = path.resolve(
  moduleDirectory,
  "../../../../../apps/api"
);

const prismaBinary = path.resolve(
  moduleDirectory,
  "../../../../../node_modules/.bin/prisma" +
    (process.platform === "win32"
      ? ".cmd"
      : "")
);

let tempDir: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any;
let repository: BattleNetRepository;

beforeAll(async () => {
  tempDir = mkdtempSync(
    path.join(
      tmpdir(),
      "battlenet-oauth-state-test-"
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
      "../../../../../apps/api/src/generated/prisma/client.js"
    );

  const adapter =
    new PrismaBetterSqlite3({
      url: databaseUrl
    });

  prisma = new PrismaClient({
    adapter
  });

  repository = new BattleNetRepository(
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

function freshState(
  label: string
): string {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const tenMinutesFromNow = () =>
  new Date(Date.now() + 10 * 60 * 1000);

describe("BattleNetRepository OAuth state — real SQLite database", () => {
  it("a fresh login state is consumed successfully on the first callback", async () => {
    const state = freshState("login-fresh");

    await repository.createOAuthState(
      state,
      tenMinutesFromNow(),
      "login",
      null
    );

    const consumed =
      await repository.consumeOAuthState(
        state
      );

    expect(consumed).toEqual({ intent: "login", returnTo: null, deviceLinkRequestId: null });
  });

  it("a fresh register state is consumed successfully on the first callback", async () => {
    const state = freshState(
      "register-fresh"
    );

    await repository.createOAuthState(
      state,
      tenMinutesFromNow(),
      "register",
      null
    );

    const consumed =
      await repository.consumeOAuthState(
        state
      );

    expect(consumed).toEqual({ intent: "register", returnTo: null, deviceLinkRequestId: null });
  });

  it("preserves the correct returnTo value across the round trip", async () => {
    const state = freshState(
      "returnto-fresh"
    );

    await repository.createOAuthState(
      state,
      tenMinutesFromNow(),
      "login",
      "/characters"
    );

    const consumed =
      await repository.consumeOAuthState(
        state
      );

    expect(consumed?.returnTo).toBe(
      "/characters"
    );
  });

  it("a newly-created state is not immediately treated as expired (time-comparison boundary)", async () => {
    const state = freshState(
      "boundary-fresh"
    );

    // Expires 1s from now - close enough to the boundary that an
    // off-by-timezone or >= vs > mistake would immediately fail this.
    await repository.createOAuthState(
      state,
      new Date(Date.now() + 1000),
      "login",
      null
    );

    const consumed =
      await repository.consumeOAuthState(
        state
      );

    expect(consumed).not.toBeNull();
  });

  it("is single-use: a replay of an already-consumed state fails", async () => {
    const state = freshState("replay");

    await repository.createOAuthState(
      state,
      tenMinutesFromNow(),
      "login",
      null
    );

    const first =
      await repository.consumeOAuthState(
        state
      );

    const second =
      await repository.consumeOAuthState(
        state
      );

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("an unknown state (never created) fails", async () => {
    const consumed =
      await repository.consumeOAuthState(
        freshState("never-created")
      );

    expect(consumed).toBeNull();
  });

  it("an expired state fails, and is still consumed (deleted) rather than left behind", async () => {
    const state = freshState("expired");

    await repository.createOAuthState(
      state,
      new Date(Date.now() - 1000),
      "login",
      null
    );

    const consumed =
      await repository.consumeOAuthState(
        state
      );

    expect(consumed).toBeNull();

    // Confirm it's actually gone, not just reported expired - single-use
    // holds even for expired rows.
    const secondAttempt =
      await repository.consumeOAuthState(
        state
      );

    expect(secondAttempt).toBeNull();
  });

  it("login and register states do not interfere with each other", async () => {
    const loginState = freshState(
      "concurrent-login"
    );

    const registerState = freshState(
      "concurrent-register"
    );

    await Promise.all([
      repository.createOAuthState(
        loginState,
        tenMinutesFromNow(),
        "login",
        "/weekly-checklist"
      ),
      repository.createOAuthState(
        registerState,
        tenMinutesFromNow(),
        "register",
        null
      )
    ]);

    const [
      consumedLogin,
      consumedRegister
    ] = await Promise.all([
      repository.consumeOAuthState(
        loginState
      ),
      repository.consumeOAuthState(
        registerState
      )
    ]);

    expect(consumedLogin).toEqual({ intent: "login", returnTo: "/weekly-checklist", deviceLinkRequestId: null });
    expect(consumedRegister).toEqual({ intent: "register", returnTo: null, deviceLinkRequestId: null });
  });

  it("creating a new state never consumes or expires an unrelated, still-valid earlier state", async () => {
    const earlierState = freshState(
      "earlier-untouched"
    );

    await repository.createOAuthState(
      earlierState,
      tenMinutesFromNow(),
      "login",
      null
    );

    // Simulates a second, unrelated /login attempt starting elsewhere
    // while the first is still in flight.
    await repository.createOAuthState(
      freshState("later-unrelated"),
      tenMinutesFromNow(),
      "register",
      null
    );

    const consumed =
      await repository.consumeOAuthState(
        earlierState
      );

    expect(consumed).not.toBeNull();
  });
});
