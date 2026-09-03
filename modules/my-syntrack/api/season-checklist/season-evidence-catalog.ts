export type SeasonEvidenceKind = "ACHIEVEMENT" | "QUEST";
export type SeasonEvidenceScope = "CHARACTER" | "WARBAND";

export type SeasonEvidenceCatalogEntry = {
  trackerKey: string;
  evidenceKind: SeasonEvidenceKind;
  externalId: number;
  goalKey: string;
  scope: SeasonEvidenceScope;
  verified: true;
  sourceUrl: string;
  /**
   * Set only for a backend-only tracker key that reinterprets an existing
   * addon-reported achievement under a different scope (e.g. a WARBAND
   * portal fact derived from accountCompleted on the same raw achievement
   * report the addon already sends for the CHARACTER-scoped tracker below).
   * No dedicated Lua catalog entry exists for these — the persistence layer
   * fans the named tracker key's raw evidence out to every catalog entry
   * that points back to it via this field, alongside its own primary write.
   * The old tracker's persisted values are never read, migrated, or
   * reinterpreted by this entry.
   */
  derivedFromTrackerKey?: string;
};

const wowheadAchievement = (id: number) =>
  `https://www.wowhead.com/achievement=${id}`;

/**
 * Canonical Midnight Season 2 evidence only.
 * Legacy tracker `season-quest-cracked-keystone` (quest 92600) is intentionally
 * absent — do not resolve or reinterpret its persisted ALWAYS values.
 */
export const SEASON_EVIDENCE_CATALOG: SeasonEvidenceCatalogEntry[] = [
  ...[
    62437, 62438, 62439, 62440, 62441, 62442, 62443, 62444
  ].map((externalId) => ({
    trackerKey: `season-portal-${externalId}`,
    evidenceKind: "ACHIEVEMENT" as const,
    externalId,
    goalKey: "portals",
    scope: "CHARACTER" as const,
    verified: true as const,
    sourceUrl: wowheadAchievement(externalId)
  })),
  ...[
    [62872, "serpent-scion", "CHARACTER"],
    [63326, "nemesis-aztarec", "CHARACTER"],
    [63333, "nemesis-aztarec-solo", "CHARACTER"],
    [63650, "aotc-ulatek", "CHARACTER"],
    [63651, "ce-ulatek", "CHARACTER"],
    [63473, "tier-visual", "WARBAND"],
    [63435, "valeera-80", "WARBAND"]
  ].map(([externalId, goalKey, scope]) => ({
    trackerKey: `season-achievement-${externalId}`,
    evidenceKind: "ACHIEVEMENT" as const,
    externalId: externalId as number,
    goalKey: goalKey as string,
    scope: scope as SeasonEvidenceScope,
    verified: true as const,
    sourceUrl: wowheadAchievement(externalId as number)
  })),
  /*
   * WARBAND portal facts. Portals are product-Warband-scoped, but the
   * existing `season-portal-<id>` CHARACTER trackers above already hold
   * persisted earnedByCharacter values that must never be reinterpreted as
   * accountCompleted (a naive scope flip would silently corrupt provenance
   * — see season-checklist.evidence.ts's Warband derivation). These new,
   * versioned tracker keys are populated exclusively from accountCompleted
   * via `derivedFromTrackerKey`, which fans the SAME raw addon achievement
   * report the old tracker already receives out to this new key too — no
   * addon change needed, and the old rows stay untouched and unread by the
   * Warband derivation.
   */
  ...[
    62437, 62438, 62439, 62440, 62441, 62442, 62443, 62444
  ].map((externalId) => ({
    trackerKey: `season-warband-portal-${externalId}-v2`,
    evidenceKind: "ACHIEVEMENT" as const,
    externalId,
    goalKey: "portals",
    scope: "WARBAND" as const,
    verified: true as const,
    sourceUrl: wowheadAchievement(externalId),
    derivedFromTrackerKey: `season-portal-${externalId}`
  })),
  {
    trackerKey: "season-quest-cracked-keystone-97910",
    evidenceKind: "QUEST",
    externalId: 97910,
    goalKey: "cracked-keystone",
    scope: "CHARACTER",
    verified: true,
    sourceUrl: "https://www.wowhead.com/quest=97910"
  }
];

export const SEASON_PORTAL_EVIDENCE = SEASON_EVIDENCE_CATALOG.filter(
  (entry) => entry.goalKey === "portals"
);

/** The 8 canonical WARBAND portal facts — never the legacy CHARACTER rows. */
export const SEASON_WARBAND_PORTAL_EVIDENCE = SEASON_EVIDENCE_CATALOG.filter(
  (entry) => entry.goalKey === "portals" && entry.scope === "WARBAND"
);

export const LEGACY_CRACKED_KEYSTONE_TRACKER_KEY =
  "season-quest-cracked-keystone";

export function seasonEvidenceForGoal(goalKey: string) {
  return SEASON_EVIDENCE_CATALOG.filter(
    (entry) => entry.goalKey === goalKey
  );
}

export function primarySeasonEvidenceForGoal(goalKey: string) {
  return seasonEvidenceForGoal(goalKey)[0] ?? null;
}
