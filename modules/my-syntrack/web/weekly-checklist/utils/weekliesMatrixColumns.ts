import { WEEKLIES_MAP_MEANING } from "../../../api/weekly-checklist/weeklies-tracker-keys.js";

export type WeekliesMatrixColumn =
  | "character"
  | "vault"
  | "mythicPlus"
  | "raid"
  | "delves"
  | "twoKRio"
  | "map"
  | "meta"
  | "professions"
  | "action";

const WEEKLIES_COLUMNS: WeekliesMatrixColumn[] = [
  "character",
  "vault",
  "mythicPlus",
  "raid",
  "delves",
  "twoKRio",
  "map",
  "meta",
  "professions",
  "action"
];

export function weekliesColumns(): WeekliesMatrixColumn[] {
  return WEEKLIES_COLUMNS;
}

export const WEEKLIES_COLUMN_LABELS: Record<
  Exclude<WeekliesMatrixColumn, "character" | "action">,
  { label: string; title?: string }
> = {
  vault: { label: "Vault" },
  mythicPlus: { label: "M+" },
  raid: { label: "Raid" },
  delves: { label: "Delves" },
  twoKRio: {
    label: "2K",
    title: "Current-season Mythic+ rating / 2,000 milestone"
  },
  map: {
    label: "MAP",
    title: WEEKLIES_MAP_MEANING
  },
  meta: {
    label: "META",
    title: "Weekly Meta Quest completion"
  },
  professions: {
    label: "Prof.",
    title: "Profession weekly work summary"
  }
};
