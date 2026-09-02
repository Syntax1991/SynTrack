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
};

const wowheadAchievement = (id: number) =>
  `https://www.wowhead.com/achievement=${id}`;

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
    [63473, "tier-visual", "WARBAND"]
  ].map(([externalId, goalKey, scope]) => ({
    trackerKey: `season-achievement-${externalId}`,
    evidenceKind: "ACHIEVEMENT" as const,
    externalId: externalId as number,
    goalKey: goalKey as string,
    scope: scope as SeasonEvidenceScope,
    verified: true as const,
    sourceUrl: wowheadAchievement(externalId as number)
  })),
  {
    trackerKey: "season-quest-cracked-keystone",
    evidenceKind: "QUEST",
    externalId: 92600,
    goalKey: "cracked-keystone",
    scope: "CHARACTER",
    verified: true,
    sourceUrl: "https://www.wowhead.com/quest=92600"
  }
];

export const SEASON_PORTAL_EVIDENCE = SEASON_EVIDENCE_CATALOG.filter(
  (entry) => entry.goalKey === "portals"
);

export function seasonEvidenceForGoal(goalKey: string) {
  return SEASON_EVIDENCE_CATALOG.filter(
    (entry) => entry.goalKey === goalKey
  );
}
