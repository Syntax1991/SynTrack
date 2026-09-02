export type AddonWeekliesQuestSignal = {
  signalKey: string;
  externalQuestId: number | null;
  flaggedCompleted: boolean | null;
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
  metaQuest: AddonWeekliesQuestSignal;
};
