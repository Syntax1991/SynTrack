export type WeekliesMatrixColumn =
  | "character"
  | "vault"
  | "mythicPlus"
  | "raid"
  | "delves"
  | "professions"
  | "progress"
  | "action";

const WEEKLIES_COLUMNS: WeekliesMatrixColumn[] = [
  "character",
  "vault",
  "mythicPlus",
  "raid",
  "delves",
  "professions",
  "progress",
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
  professions: {
    label: "Prof.",
    title: "Profession weekly work summary"
  },
  progress: { label: "Progress" }
};
