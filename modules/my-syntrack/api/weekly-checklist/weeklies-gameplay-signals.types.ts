export type WeekliesSignalState =
  | "COMPLETE"
  | "INCOMPLETE"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type WeekliesGameplaySignal = {
  state: WeekliesSignalState;
  label: string;
  title: string;
  actionLabel: string | null;
};

export type WeekliesGameplaySignalSource = {
  configured: boolean;
  trackerName: string | null;
  resetBehavior: string | null;
};

export type WeekliesGameplaySignals = {
  map: WeekliesGameplaySignal;
  meta: WeekliesGameplaySignal;
  sources: {
    map: WeekliesGameplaySignalSource;
    meta: WeekliesGameplaySignalSource;
  };
};
