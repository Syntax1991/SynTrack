import type { OverviewAggregationInput } from "./overview.aggregator.js";

export const period = {
  key: "2026-08-26",
  startsAt: "2026-08-26T07:00:00.000Z",
  endsAt: "2026-09-02T07:00:00.000Z"
};

export function baseCharacter(
  overrides: Partial<
    OverviewAggregationInput["characters"][number]
  > = {}
) {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    ...overrides
  };
}

export function baseInput(
  overrides: Partial<OverviewAggregationInput> = {}
): OverviewAggregationInput {
  return {
    period,
    weeklyTaskCount: 5,
    characters: [baseCharacter()],
    weeklyByCharacterId: new Map(),
    vaultByCharacterId: new Map(),
    gearByCharacterId: new Map(),
    professionByCharacterId:
      new Map(),
    resourceByCharacterId:
      new Map(),
    trackerStatesByCharacterId:
      new Map(),
    ...overrides
  };
}

export const fullWeeklyCompletion =
  [
    "great-vault",
    "mythic-plus",
    "raid-readiness",
    "profession-knowledge",
    "gear-readiness"
  ];
