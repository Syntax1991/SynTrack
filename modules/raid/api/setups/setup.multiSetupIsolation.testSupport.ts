import { vi } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidBossRosterService } from "../boss-rosters/boss-roster.service.js";
import { createFakeCooldownService } from "./setup.multiSetupIsolation.cooldownSupport.js";
import { RaidSetupService } from "./setup.service.js";
import type { RaiderLinkGuard } from "./setup.types.js";

/**
 * The mandatory acceptance environment for this slice: same
 * RaidEvent, same RaidBoss, same member, but every Setup id used
 * below comes from the REAL `RaidSetupService.createSetup` API (not
 * hand-typed "setup-A"/"setup-B" strings) — so a bug where createSetup
 * returned colliding or reused ids would be caught here too, not just
 * a bug in the downstream filtering. Every fake is a real filtering
 * store keyed by the exact ids in play, shared across all three real
 * services (Setup, BossRoster, Cooldown), not a canned mock that
 * always returns the same value regardless of which Setup was asked
 * for.
 */
export function createSharedFakeEnvironment() {
  const event = {
    id: "event-1",
    raidEventId: "event-1",
    teamId: null
  };

  const boss = {
    id: "boss-1",
    raidEventId: "event-1"
  };

  const setups = new Map<
    string,
    { id: string; raidEventId: string }
  >();

  const setupMembers = new Set<string>();

  const bossRosterEntries = new Map<
    string,
    {
      bossId: string;
      setupId: string;
      memberId: string;
      status: string;
      specId: number | null;
    }
  >();

  const planMembers = new Map<
    string,
    {
      bossId: string;
      setupId: string;
      memberId: string;
    }
  >();

  const assignments = new Map<
    string,
    {
      id: string;
      bossId: string;
      setupId: string;
      memberId: string;
      abilityName: string;
      spellId: number | null;
      abilityIcon: string | null;
      phaseLabel: string | null;
      timestampSeconds: number | null;
      sortOrder: number;
    }
  >();

  const memberKey = (
    setupId: string,
    memberId: string
  ) => `${setupId}:${memberId}`;

  const entryKey = (
    bossId: string,
    setupId: string,
    memberId: string
  ) => `${bossId}:${setupId}:${memberId}`;

  let nextSetupId = 1;

  const assignmentIdCounter = {
    value: 1
  };

  const setupRepository = {
    findEventById: vi.fn(async () => event),
    findMemberById: vi.fn(async () => ({
      id: "member-1",
      className: "Paladin"
    })),
    getOrCreateForEvent: vi.fn(async () => {
      throw new Error(
        "not used in this test — createSetup is called directly"
      );
    }),
    findAllForEvent: vi.fn(async () =>
      Array.from(setups.values())
    ),
    createSetup: vi.fn(
      async (eventId: string) => {
        const id = `real-setup-${nextSetupId}`;

        nextSetupId += 1;

        const setup = {
          id,
          raidPlanId: "plan-1",
          raidEventId: eventId,
          key: `key-${id}`,
          name: "Setup",
          members: []
        };

        setups.set(id, setup);

        return setup;
      }
    ),
    findSetupById: vi.fn(
      async (setupId: string) =>
        setups.get(setupId) ?? null
    ),
    addMembers: vi.fn(
      async (
        setupId: string,
        memberIds: string[]
      ) => {
        for (const memberId of memberIds) {
          setupMembers.add(
            memberKey(setupId, memberId)
          );
        }
      }
    ),
    removeMember: vi.fn(async () => {}),
    isSetupMember: vi.fn(
      async (
        setupId: string,
        memberId: string
      ) =>
        setupMembers.has(
          memberKey(setupId, memberId)
        )
    )
  };

  const rosterRepository = {
    findAll: vi.fn(async () => [])
  };

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {}),
    requireCurrentOfficer: vi.fn(
      async () => ({ id: "officer-1" })
    )
  };

  const raiderLink: RaiderLinkGuard = {
    getLinkedMember: vi.fn(async () => ({
      id: "officer-1"
    }))
  };

  const setupService = new RaidSetupService(
    setupRepository as never,
    rosterRepository as never,
    {} as never,
    verification,
    raiderLink
  );

  const bossRosterRepository = {
    findEventById: vi.fn(async () => event),
    findMemberById: vi.fn(async () => ({
      id: "member-1",
      className: "Paladin"
    })),
    findBossById: vi.fn(async () => boss),
    findBossesForSetup: vi.fn(async () => []),
    findBossWithSetupEntries: vi.fn(
      async (
        bossId: string,
        setupId: string
      ) => ({
        id: bossId,
        raidEventId: "event-1",
        rosterEntries: Array.from(
          bossRosterEntries.values()
        ).filter(
          (entry) =>
            entry.bossId === bossId &&
            entry.setupId === setupId
        )
      })
    ),
    upsertEntry: vi.fn(
      async (
        bossId: string,
        setupId: string,
        memberId: string,
        status: string
      ) => {
        bossRosterEntries.set(
          entryKey(
            bossId,
            setupId,
            memberId
          ),
          {
            bossId,
            setupId,
            memberId,
            status,
            specId: null
          }
        );
      }
    ),
    deleteEntry: vi.fn(async () => {}),
    findEntry: vi.fn(
      async (
        bossId: string,
        setupId: string,
        memberId: string
      ) =>
        bossRosterEntries.get(
          entryKey(bossId, setupId, memberId)
        ) ?? null
    ),
    updateSpec: vi.fn(
      async (
        bossId: string,
        setupId: string,
        memberId: string,
        specId: number | null
      ) => {
        const entry = bossRosterEntries.get(
          entryKey(bossId, setupId, memberId)
        );

        if (entry) {
          entry.specId = specId;
        }
      }
    )
  };

  const bossRosterService =
    new RaidBossRosterService(
      bossRosterRepository as never,
      rosterRepository as never,
      setupRepository as never,
      verification,
      raiderLink
    );

  const cooldownService = createFakeCooldownService({
    boss,
    setupRepository,
    verification,
    planMembers,
    assignments,
    entryKey,
    assignmentIdCounter
  });

  return {
    setupService,
    bossRosterService,
    cooldownService,
    setupMembers,
    bossRosterEntries,
    planMembers,
    assignments,
    memberKey,
    entryKey
  };
}
