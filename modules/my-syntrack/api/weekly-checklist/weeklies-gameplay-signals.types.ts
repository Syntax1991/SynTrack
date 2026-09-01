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
  twoKRio: WeekliesGameplaySignal;
  map: WeekliesGameplaySignal;
  meta: WeekliesGameplaySignal;
  sources: {
    twoKRio: WeekliesGameplaySignalSource;
    map: WeekliesGameplaySignalSource;
    meta: WeekliesGameplaySignalSource;
  };
};
