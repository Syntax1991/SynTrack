export type CellTokenTone =
  | "ready"
  | "attention"
  | "progress"
  | "unknown"
  | "not-tracked";

export type CellToken = {
  symbol: string;
  tone: CellTokenTone;
  title: string;
};
