import type { CharacterListView } from "../../../api/character-tracking/character-list-view.js";

export type OverviewMatrixColumn =
  | "character"
  | "ilvl"
  | "set"
  | "emb"
  | "weeklies"
  | "trackers"
  | "prof"
  | "spark"
  | "cata"
  | "action";

const ALL_COLUMNS: OverviewMatrixColumn[] = [
  "character",
  "ilvl",
  "set",
  "emb",
  "weeklies",
  "trackers",
  "prof",
  "spark",
  "cata",
  "action"
];

const GAMEPLAY_COLUMNS: OverviewMatrixColumn[] = [
  "character",
  "ilvl",
  "set",
  "emb",
  "weeklies",
  "trackers",
  "spark",
  "cata",
  "action"
];

const PROFESSIONS_COLUMNS: OverviewMatrixColumn[] = [
  "character",
  "ilvl",
  "weeklies",
  "prof",
  "action"
];

export function overviewColumnsForView(
  view: CharacterListView
): OverviewMatrixColumn[] {
  if (view === "gameplay") {
    return GAMEPLAY_COLUMNS;
  }

  if (view === "professions") {
    return PROFESSIONS_COLUMNS;
  }

  return ALL_COLUMNS;
}

export function overviewColumnCount(
  columns: OverviewMatrixColumn[],
  trackerCount: number
): number {
  return columns.reduce(
    (total, column) =>
      total + (column === "trackers" ? trackerCount : 1),
    0
  );
}
