import { createDefaultWeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { WeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";

export function defaultGameplaySignals(): WeekliesGameplaySignals {
  return createDefaultWeekliesGameplaySignals();
}
