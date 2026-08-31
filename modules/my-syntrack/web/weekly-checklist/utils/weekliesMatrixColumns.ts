import type { CharacterListView } from "../../../api/character-tracking/character-list-view.js";

export type WeekliesMatrixColumn =
  | "character"
  | "vault"
  | "mythicPlus"
  | "raid"
  | "delves"
  | "quest"
  | "treatise"
  | "drops"
  | "progress"
  | "action";

const ALL_COLUMNS: WeekliesMatrixColumn[] = [
  "character",
  "vault",
  "mythicPlus",
  "raid",
  "delves",
  "quest",
  "treatise",
  "drops",
  "progress",
  "action"
];

const GAMEPLAY_COLUMNS: WeekliesMatrixColumn[] = [
  "character",
  "vault",
  "mythicPlus",
  "raid",
  "delves",
  "progress",
  "action"
];

const PROFESSIONS_COLUMNS: WeekliesMatrixColumn[] = [
  "character",
  "quest",
  "treatise",
  "drops",
  "progress",
  "action"
];

export function weekliesColumnsForView(
  view: CharacterListView
): WeekliesMatrixColumn[] {
  if (view === "gameplay") {
    return GAMEPLAY_COLUMNS;
  }

  if (view === "professions") {
    return PROFESSIONS_COLUMNS;
  }

  return ALL_COLUMNS;
}

export const WEEKLIES_COLUMN_LABELS: Record<
  Exclude<WeekliesMatrixColumn, "character" | "action">,
  { label: string; title?: string }
> = {
  vault: { label: "Vault" },
  mythicPlus: { label: "M+" },
  raid: { label: "Raid" },
  delves: { label: "Delves" },
  quest: { label: "Quest" },
  treatise: { label: "Treat." },
  drops: { label: "Drops" },
  progress: { label: "Progress" }
};
