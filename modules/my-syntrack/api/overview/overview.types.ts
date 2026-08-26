/*
 * Types for the "My SynTrack" Overview - a READ MODEL, not a new source of
 * truth. Every field here is derived from data already owned by Weekly
 * Checklist, Vault/Mythic+, Professions or Gear; nothing is persisted
 * here (see overview.aggregator.ts).
 *
 * State semantics (kept consistent across every domain - see
 * overview.aggregator.ts's doc comment for exactly which real facts back
 * each value):
 *   READY        - explicitly proven complete/fine
 *   IN_PROGRESS  - tracked, incomplete, normal remaining work (not itself
 *                  a problem)
 *   ATTENTION    - tracked and an actionable issue exists
 *   UNKNOWN      - some tracked signal exists, but it cannot honestly be
 *                  read as done/not-done (e.g. 0 Vault runs this period -
 *                  indistinguishable from "hasn't looked yet")
 *   NOT_TRACKED  - the character has no data for this domain at all
 */
import type {
  CharacterTrackerState,
  TrackerDefinitionView
} from "../trackers/tracker.types.js";

export type {
  CharacterTrackerState,
  TrackerDefinitionView,
  TrackerNormalizedValue,
  TrackerValueType
} from "../trackers/tracker.types.js";

export type OverviewDomainState =
  | "READY"
  | "IN_PROGRESS"
  | "ATTENTION"
  | "UNKNOWN"
  | "NOT_TRACKED";

export type OverviewReadinessState =
  | "ready"
  | "attention"
  | "blocking"
  | "unknown";

export type AttentionDomain =
  | "weekly"
  | "vault"
  | "profession"
  | "gear";

export type AttentionSeverity =
  | "blocking"
  | "urgent"
  | "this-week"
  | "optional";

export type AttentionItem = {
  id: string;
  characterId: string;
  characterName: string;
  domain: AttentionDomain;
  severity: AttentionSeverity;
  label: string;
  detail: string | null;
  path: string;
};

export type WeeklyOverviewState = {
  state: OverviewDomainState;
  completed: number;
  total: number;
  source: "MANUAL_CHECKLIST";
};

export type VaultOverviewState = {
  state: OverviewDomainState;
  unlockedSlots: number;
  slotsTotal: number;
  highestKeyLevel: number | null;
  source: "MANUAL_LOG";
};

export type ProfessionOverviewState = {
  state: OverviewDomainState;
  issueCount: number;
  issues: string[];
};

export type GearOverviewState = {
  state: OverviewDomainState;
  readinessPercent: number | null;
  trackedSlots: number;
  totalRelevantSlots: number;
  missingEnchantCount: number;
  emptySocketCount: number;
  /*
   * The same averageItemLevel GearReadinessService already computes and
   * shows on the Gear page itself - null whenever trackedSlots is 0,
   * never a fabricated number.
   */
  itemLevel: number | null;
};

/*
 * Tier/Set and Embellishments have no data source anywhere in SynTrack
 * today (CharacterGearSlot has no "is this a tier piece"/"embellishment
 * identity" concept) - both are permanently NOT_TRACKED until a future
 * Gear-capture phase. Modeled now, deliberately minimal, so the matrix's
 * column contract does not need to change again once that data exists.
 */
export type TierOverviewState = {
  state: "NOT_TRACKED";
};

export type EmbellishmentOverviewState = {
  state: "NOT_TRACKED";
};

export type CharacterWeeklyState = {
  character: {
    id: string;
    name: string;
    realm: string;
    region: string;
    className: string;
    level: number;
  };
  weekly: WeeklyOverviewState;
  vault: VaultOverviewState;
  professions: ProfessionOverviewState;
  gear: GearOverviewState;
  tier: TierOverviewState;
  embellishments: EmbellishmentOverviewState;
  /*
   * Pinned+enabled tracker states for the active scope, aligned by
   * trackerDefinitionId to OverviewResponse.trackerColumns - Overview
   * only reads these (via TrackerValueService's batched read); it does
   * not own or duplicate tracker completion logic.
   */
  trackers: CharacterTrackerState[];
  attentionItems: AttentionItem[];
  readinessState: OverviewReadinessState;
  nextAction: {
    domain: AttentionDomain;
    label: string;
    detail: string | null;
    path: string;
    severity: AttentionSeverity;
  } | null;
};

export type OverviewSummary = {
  period: {
    key: string;
    startsAt: string;
    endsAt: string;
  };
  characterCount: number;
  readyCount: number;
  attentionCount: number;
  weeklyProgress: {
    completed: number;
    total: number;
  };
  vault: {
    trackedCount: number;
    fullyUnlockedCount: number;
  };
};

export type OverviewResponse = {
  summary: OverviewSummary;
  attentionItems: AttentionItem[];
  characters: CharacterWeeklyState[];
  trackerColumns: TrackerDefinitionView[];
};
