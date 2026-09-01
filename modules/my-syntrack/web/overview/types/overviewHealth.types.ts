export type DomainHealthState =
  | "FRESH"
  | "STALE"
  | "PARTIAL"
  | "NEVER_CAPTURED"
  | "NOT_TRACKED"
  | "MANUAL";

export type ProfessionHealthEntry = {
  professionId: string;
  name: string;
  state: "FRESH" | "STALE" | "NEVER_CAPTURED";
  lastSyncedAt: string | null;
};

export type CharacterDataHealth = {
  characterId: string;
  character: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  professions: {
    state: DomainHealthState;
    items: ProfessionHealthEntry[];
  };
  gear: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  resources: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  professionWeekly: {
    state: DomainHealthState;
    items: ProfessionHealthEntry[];
  };
};
