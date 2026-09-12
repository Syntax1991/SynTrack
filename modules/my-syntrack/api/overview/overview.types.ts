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
import type { TrackerScopeProfileView } from "../trackers/tracker-scope-profile.types.js";
import type { TagView } from "../tags/tag.types.js";
import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { CharacterDataHealth } from "../data-health/data-health.types.js";
import type {
  AccountResourceView,
  ResourceItemView
} from "../resources/resource-readiness.types.js";
import type {
  ProfessionWeeklyAggregate,
  ProfessionWeeklyProfessionSummary
} from "../profession-weekly/profession-weekly-status.types.js";
import type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureProfessionSummary
} from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type {
  ProfessionSetupOverviewState,
  WeeklySummaryOverviewState
} from "./overview-triage.types.js";

export type {
  ProfessionWeeklyAggregate,
  ProfessionWeeklyProfessionSummary,
  ProfessionWeeklySourceStatus
} from "../profession-weekly/profession-weekly-status.types.js";

export type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureProfessionSummary,
  ProfessionKnowledgeTreasureSourceStatus
} from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";

export type {
  ProfessionSetupOverviewState,
  ProfessionSetupProfessionSummary,
  WeeklySummaryDomainDetail,
  WeeklySummaryOverviewState
} from "./overview-triage.types.js";

export type {
  CharacterTrackerState,
  TrackerDefinitionView,
  TrackerNormalizedValue,
  TrackerValueType
} from "../trackers/tracker.types.js";

export type {
  TrackerScopeProfileView
} from "../trackers/tracker-scope-profile.types.js";

export type { TagView } from "../tags/tag.types.js";

export type {
  CharacterDataHealth,
  DomainHealthState,
  ProfessionHealthEntry
} from "../data-health/data-health.types.js";

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
  | "profession-weekly"
  | "profession-knowledge-treasure"
  | "gear"
  | "resources";

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
  source: "MANUAL_LOG" | "ADDON";
};

export type ProfessionOverviewState = {
  state: OverviewDomainState;
  issueCount: number;
  issues: string[];
  items: CharacterProfessionSummary[];
};

export type CharacterProfessionSummary = {
  professionId: string;
  key: string;
  name: string;
  category: string;
  skill: number;
  knowledgePoints: number;
  dataStatus:
    | "TRACKED"
    | "PARTIAL"
    | "UNTRACKED"
    | "NO_CATALOG";
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

export type ResourceOverviewState = {
  state: OverviewDomainState;
  trackedResourceCount: number;
  totalRelevantResourceCount: number;
  attentionCount: number;
  items: ResourceItemView[];
};

export type {
  AccountResourceView,
  ResourceItemView
} from "../resources/resource-readiness.types.js";
export type { ResourceCategory } from "../resources/resource-definition.types.js";

/*
 * Tier/Set + Embellishments from Gear v2 slot evidence.
 * Unresolved evidence stays UNKNOWN (never a fabricated 0).
 */
export type TierOverviewState = {
  state: OverviewDomainState;
  equippedPieces: number;
  targetPieces: number;
  twoPiece: boolean;
  fourPiece: boolean;
  rawEquippedPieces: number;
  slots?: string[];
};

export type EmbellishmentOverviewState = {
  state: OverviewDomainState;
  equippedPieces: number;
  targetPieces: number;
};

/*
 * Weekly Quest, Treatise, and Knowledge Drops are separate aggregates -
 * a combined number hides which source is missing. Drops never affect
 * `state`. NOT_TRACKED = no enabled definitions for this character.
 */
export type ProfessionWeeklyOverviewState = {
  state: OverviewDomainState;
  quest: ProfessionWeeklyAggregate;
  treatise: ProfessionWeeklyAggregate;
  drops: ProfessionWeeklyAggregate;
  professions: ProfessionWeeklyProfessionSummary[];
};

/*
 * Permanent Knowledge Treasures - separate from weekly profession state.
 * Not a mandatory Overview column; attention only when incomplete.
 */
export type ProfessionKnowledgeTreasureOverviewState = {
  state: OverviewDomainState;
  treasures: ProfessionKnowledgeTreasureAggregate;
  professions: ProfessionKnowledgeTreasureProfessionSummary[];
};

export type CharacterWeeklyState = {
  character: {
    id: string;
    name: string;
    realm: string;
    region: string;
    className: string;
    level: number;
    race: string | null; faction: string | null; activeSpec: string | null;
    guild: { name: string; realmSlug: string | null } | null;
    averageItemLevel: number | null; equippedItemLevel: number | null;
  };
  weekly: WeeklyOverviewState;
  weeklySummary: WeeklySummaryOverviewState;
  weeklyAction: {
    domain: AttentionDomain;
    label: string;
    detail: string | null;
    path: string;
    severity: AttentionSeverity;
  } | null;
  vault: VaultOverviewState;
  professions: ProfessionOverviewState;
  professionSetup: ProfessionSetupOverviewState;
  gear: GearOverviewState;
  resources: ResourceOverviewState;
  tier: TierOverviewState;
  embellishments: EmbellishmentOverviewState;
  professionWeekly: ProfessionWeeklyOverviewState;
  professionKnowledgeTreasures: ProfessionKnowledgeTreasureOverviewState;
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

/*
 * The aggregator (overview.aggregator.ts) only ever produces this base
 * shape - refreshNeededCount is computed by OverviewService afterward
 * from Data Health, which the core aggregator does not need to know
 * about (see CharacterOverviewRow below).
 */
export type OverviewSummaryBase = {
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

export type OverviewSummary =
  OverviewSummaryBase & {
    /*
     * Count of characters whose OWN addon-sync is stale/never
     * captured (see data-health.mapper.ts's characterNeedsRefresh) - a
     * MANUAL character that was never meant to be addon-tracked is
     * never counted here.
     */
    refreshNeededCount: number;
  };

/*
 * Additive, presentation-only facts attached to a CharacterWeeklyState
 * row after Overview's own weekly/vault/gear/profession aggregation
 * has already run (see overview.service.ts) - tags and data-health
 * never participate in readinessState/attentionItems/nextAction, so
 * the core aggregator (overview.aggregator.ts) does not need to know
 * about either concept.
 */
export type CharacterOverviewRow =
  CharacterWeeklyState & {
    tags: TagView[];
    trackingProfile: CharacterTrackingProfile;
    health: CharacterDataHealth;
  };

export type OverviewResponse = {
  summary: OverviewSummary;
  attentionItems: AttentionItem[];
  characters: CharacterOverviewRow[];
  trackerColumns: TrackerDefinitionView[];
  activeScope: TrackerScopeProfileView | null;
  accountResources: AccountResourceView[];
};

/*
 * The Character Detail Hub's read model - reuses the exact same
 * CharacterOverviewRow one Overview row already carries, scoped to a
 * single character. No new aggregation logic: OverviewService derives
 * this by reusing getOverview() and finding the one character.
 */
export type CharacterControlDetailResponse = {
  period: OverviewSummary["period"];
  character: CharacterOverviewRow;
  trackerColumns: TrackerDefinitionView[];
};
