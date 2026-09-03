export type AddonWeekliesQuestSignal = {
  signalKey: string;
  externalQuestId: number | null;
  flaggedCompleted: boolean | null;
};

export type AddonWeekliesMetaQuestEvidence = {
  questId: number;
  flaggedCompleted: boolean | null;
};

export type AddonWeekliesMetaQuestSignal = AddonWeekliesQuestSignal & {
  /** Per-quest diagnostics; schemaVersion >= 2 when present. */
  evidence: AddonWeekliesMetaQuestEvidence[];
};

export type AddonWeekliesMythicPlusRatingCapture = {
  captured: boolean;
  seasonRating: number | null;
};

export type AddonWeekliesSignalsSnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  mythicPlusRating: AddonWeekliesMythicPlusRatingCapture;
  troveHuntersBountyUsed: AddonWeekliesQuestSignal;
  metaQuest: AddonWeekliesMetaQuestSignal;
};
