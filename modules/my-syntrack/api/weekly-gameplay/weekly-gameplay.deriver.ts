import type {
  WeeklyGameplayCharacterView,
  WeeklyGameplayDomainView,
  WeeklyGameplaySnapshotInput
} from "./weekly-gameplay.types.js";

const MYTHIC_PLUS_VAULT_CAP = 8;

function unknownDomain(label: string): WeeklyGameplayDomainView {
  return {
    state: "UNKNOWN",
    completeCount: 0,
    applicableTotal: 0,
    unknownCount: 1,
    label
  };
}

function knownDomain(
  label: string,
  completeCount: number,
  applicableTotal: number
): WeeklyGameplayDomainView {
  if (applicableTotal <= 0) {
    return unknownDomain(label);
  }

  const incomplete = completeCount < applicableTotal;

  return {
    state: incomplete ? "ATTENTION" : "READY",
    completeCount,
    applicableTotal,
    unknownCount: 0,
    label
  };
}

function vaultFamily(
  typeName: string | null
): "mythic-plus" | "raid" | "world" | null {
  const name = typeName?.toLowerCase() ?? "";

  if (
    name === "activities" ||
    name === "mythicplus" ||
    name === "dungeon"
  ) {
    return "mythic-plus";
  }

  if (name === "raid") {
    return "raid";
  }

  if (name === "world") {
    return "world";
  }

  return null;
}

function unlocked(activity: {
  threshold: number | null;
  progress: number | null;
}): boolean {
  return (
    activity.threshold !== null &&
    activity.progress !== null &&
    activity.progress >= activity.threshold
  );
}

function deriveVault(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  if (!snapshot.vaultCaptured || snapshot.vaultCurrentPeriod !== true) {
    return unknownDomain("Vault");
  }

  const families = new Set<"mythic-plus" | "raid" | "world">();

  for (const activity of snapshot.vaultActivities) {
    const family = vaultFamily(activity.typeName);

    if (family && unlocked(activity)) {
      families.add(family);
    }
  }

  return knownDomain("Vault", families.size, 3);
}

function deriveMythicPlus(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  if (!snapshot.mythicPlusCaptured) {
    return unknownDomain("M+");
  }

  const completedThisWeek = snapshot.mythicPlusRuns.filter(
    (run) => run.completed !== false && run.thisWeek !== false
  ).length;

  return knownDomain("M+", completedThisWeek, MYTHIC_PLUS_VAULT_CAP);
}

function parseKilledEncounters(encountersJson: string): {
  killed: number;
  total: number;
} | null {
  try {
    const parsed = JSON.parse(encountersJson) as Array<{
      isKilled?: boolean | null;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    return {
      killed: parsed.filter((encounter) => encounter.isKilled === true).length,
      total: parsed.length
    };
  } catch {
    return null;
  }
}

function deriveRaid(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  if (!snapshot.raidCaptured) {
    return unknownDomain("Raid");
  }

  const lockouts = [...snapshot.raidLockouts].sort(
    (left, right) => (right.numEncounters ?? 0) - (left.numEncounters ?? 0)
  );
  const primary = lockouts[0];

  if (!primary) {
    return unknownDomain("Raid");
  }

  const parsed = parseKilledEncounters(primary.encountersJson);

  if (parsed) {
    return knownDomain("Raid", parsed.killed, parsed.total);
  }

  if (
    primary.encounterProgress !== null &&
    primary.numEncounters !== null &&
    primary.numEncounters > 0
  ) {
    return knownDomain(
      "Raid",
      primary.encounterProgress,
      primary.numEncounters
    );
  }

  return unknownDomain("Raid");
}

function deriveDelves(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  if (!snapshot.vaultCaptured || snapshot.vaultCurrentPeriod !== true) {
    return unknownDomain("Delves");
  }

  const world = snapshot.vaultActivities.filter(
    (activity) => vaultFamily(activity.typeName) === "world"
  );

  if (world.length === 0) {
    return unknownDomain("Delves");
  }

  const unlockedCount = world.filter(unlocked).length;
  return knownDomain("Delves", unlockedCount, world.length);
}

export function deriveWeeklyGameplay(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayCharacterView {
  const mythicPlus = deriveMythicPlus(snapshot);
  const raid = deriveRaid(snapshot);
  const remainingRuns = Math.max(
    0,
    MYTHIC_PLUS_VAULT_CAP - mythicPlus.completeCount
  );

  return {
    characterId: snapshot.characterId,
    vault: deriveVault(snapshot),
    mythicPlus,
    raid,
    delves: deriveDelves(snapshot),
    mythicPlusAction:
      mythicPlus.state === "ATTENTION" && remainingRuns > 0
        ? `${remainingRuns} more M+ run${remainingRuns === 1 ? "" : "s"} for Vault slot 3`
        : null,
    raidAction:
      raid.state === "ATTENTION"
        ? `${Math.max(0, raid.applicableTotal - raid.completeCount)} raid bosses remaining`
        : null
  };
}
