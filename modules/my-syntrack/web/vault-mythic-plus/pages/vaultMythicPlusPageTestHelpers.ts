import type {
  VaultDomainProgress,
  VaultGameplayCharacter,
  VaultMythicPlusResponse,
  VaultSlotDetail,
  VaultSlotState
} from "../types/vaultMythicPlus.types";

function domain(
  overrides: Partial<VaultDomainProgress> = {}
): VaultDomainProgress {
  return {
    state: "ATTENTION",
    completeCount: 0,
    applicableTotal: 0,
    knownUnlockedSlots: 0,
    maxSlots: 0,
    hasUnknownCategories: false,
    unresolvedCategoryLabels: [],
    ...overrides
  };
}

function slots(
  state: VaultSlotState,
  levels: Array<[number | null, string | null, number | null, number | null]>
): VaultSlotDetail[] {
  return ([1, 2, 3] as const).map((slot, index) => {
    const [threshold, rewardLabel, progress, level] = levels[index] ?? [
      null,
      null,
      null,
      null
    ];
    return { slot, state, threshold, progress, level, rewardLabel };
  });
}

function character(
  overrides: Partial<VaultGameplayCharacter> &
    Pick<VaultGameplayCharacter, "id" | "name" | "className">
): VaultGameplayCharacter {
  return {
    realm: "Antonidas",
    region: "eu",
    level: 90,
    trackingProfile: "FULL",
    vault: domain(),
    mythicPlus: domain(),
    raid: domain(),
    delves: domain(),
    mythicPlusSlots: slots("UNKNOWN", [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ]),
    raidSlots: slots("UNKNOWN", [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ]),
    worldSlots: slots("UNKNOWN", [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ]),
    highestKeyLevel: null,
    mythicPlusRunCount: null,
    mythicPlusRuns: [],
    action: "Not captured this week",
    vaultCaptured: false,
    vaultCurrent: false,
    ...overrides
  };
}

export const vaultMythicPlusPageMockOverview: VaultMythicPlusResponse = {
  period: {
    key: "2026-08-26",
    startsAt: "2026-08-26T07:00:00.000Z",
    endsAt: "2026-09-02T07:00:00.000Z"
  },
  characters: [
    character({
      id: "char-1",
      name: "Synblast",
      className: "Shaman",
      vault: domain({
        state: "ATTENTION",
        completeCount: 6,
        applicableTotal: 9,
        knownUnlockedSlots: 6,
        maxSlots: 9
      }),
      mythicPlus: domain({
        state: "READY",
        completeCount: 8,
        applicableTotal: 8,
        knownUnlockedSlots: 3,
        maxSlots: 3
      }),
      raid: domain({
        state: "READY",
        completeCount: 6,
        applicableTotal: 6,
        knownUnlockedSlots: 3,
        maxSlots: 3
      }),
      delves: domain({
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 8,
        knownUnlockedSlots: 0,
        maxSlots: 3
      }),
      mythicPlusSlots: slots("UNLOCKED", [
        [1, "+15", 8, 15],
        [4, "+14", 8, 14],
        [8, "+13", 8, 13]
      ]),
      raidSlots: slots("UNLOCKED", [
        [2, "Heroic", 6, 15],
        [4, "Heroic", 6, 15],
        [6, "Heroic", 6, 15]
      ]),
      worldSlots: slots("LOCKED", [
        [2, null, 0, 0],
        [4, null, 0, 0],
        [8, null, 0, 0]
      ]),
      highestKeyLevel: 15,
      mythicPlusRunCount: 2,
      mythicPlusRuns: [
        {
          mapChallengeModeId: 503,
          keyLevel: 15,
          completed: true,
          thisWeek: true,
          durationSec: 1800
        }
      ],
      action: "2 World activities for Vault slot 1",
      vaultCaptured: true,
      vaultCurrent: true
    }),
    character({
      id: "char-2",
      name: "Syndraco",
      className: "Evoker",
      vault: domain({
        state: "ATTENTION",
        completeCount: 2,
        applicableTotal: 9,
        knownUnlockedSlots: 2,
        maxSlots: 9
      }),
      mythicPlus: domain({
        state: "ATTENTION",
        completeCount: 4,
        applicableTotal: 8,
        knownUnlockedSlots: 2,
        maxSlots: 3
      }),
      raid: domain({
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 6,
        knownUnlockedSlots: 0,
        maxSlots: 3
      }),
      delves: domain({
        state: "ATTENTION",
        completeCount: 0,
        applicableTotal: 8,
        knownUnlockedSlots: 0,
        maxSlots: 3
      }),
      mythicPlusSlots: [
        {
          slot: 1,
          state: "UNLOCKED",
          threshold: 1,
          progress: 4,
          level: 10,
          rewardLabel: "+10"
        },
        {
          slot: 2,
          state: "UNLOCKED",
          threshold: 4,
          progress: 4,
          level: 8,
          rewardLabel: "+8"
        },
        {
          slot: 3,
          state: "LOCKED",
          threshold: 8,
          progress: 4,
          level: null,
          rewardLabel: null
        }
      ],
      raidSlots: slots("LOCKED", [
        [2, null, 0, 0],
        [4, null, 0, 0],
        [6, null, 0, 0]
      ]),
      worldSlots: slots("LOCKED", [
        [2, null, 0, 0],
        [4, null, 0, 0],
        [8, null, 0, 0]
      ]),
      highestKeyLevel: 10,
      mythicPlusRunCount: 4,
      mythicPlusRuns: [],
      action: "4 more M+ runs for Vault slot 3",
      vaultCaptured: true,
      vaultCurrent: true
    }),
    character({
      id: "char-3",
      name: "Synbloom",
      className: "Druid"
    })
  ],
  summary: {
    characterCount: 3,
    attentionCount: 3,
    readyCount: 0
  }
};
