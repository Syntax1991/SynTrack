export type ClientCharacterIdentityRow = {
  id: string;
  name: string;
  realm: string;
  className: string;
  level: number;
};

/*
 * itemLevel and lastSyncedAt are both nullable on purpose - UNKNOWN is
 * always reported honestly rather than guessed or defaulted to zero/now.
 * itemLevel is null until GearReadinessService has at least one tracked
 * gear slot for the character; lastSyncedAt is null until any addon
 * capture (gear or resources) has ever been recorded for it.
 */
export type ClientCharacterSummary = {
  id: string;
  name: string;
  realm: string;
  className: string;
  level: number;
  itemLevel: number | null;
  lastSyncedAt: string | null;
};
