import type { ResourceItemView } from "../resources/resource-readiness.types.js";
import type {
  AttentionItem,
  ResourceOverviewState
} from "./overview.types.js";

export type OverviewResourceCharacterInput = {
  id: string;
  name: string;
  resources: ResourceItemView[];
};

/*
 * Resources is owned by ResourceReadinessService - this only reads its
 * already-computed per-resource snapshots/attention flags, exactly like
 * Gear's own overview mapper reads GearReadinessService's issues. A
 * character with zero tracked (CHARACTER-scoped) resource definitions is
 * NOT_TRACKED, never a false ATTENTION/READY. The full item list rides
 * along (not just counts) so Character Detail can show factual per-
 * resource values without a second request - Overview itself only ever
 * renders the compact state/attentionCount, never one column per item.
 */
export function resolveResourceOverviewState(
  character: OverviewResourceCharacterInput
): {
  resources: ResourceOverviewState;
  attentionItem: AttentionItem | null;
} {
  const trackedResourceCount =
    character.resources.filter(
      (resource) => resource.snapshot !== null
    ).length;

  const attentionCount = character.resources.filter(
    (resource) => resource.attentionNeeded
  ).length;

  const resources: ResourceOverviewState = {
    state:
      trackedResourceCount === 0
        ? "NOT_TRACKED"
        : attentionCount > 0
          ? "ATTENTION"
          : "READY",
    trackedResourceCount,
    totalRelevantResourceCount:
      character.resources.length,
    attentionCount,
    items: character.resources
  };

  if (resources.state !== "ATTENTION") {
    return { resources, attentionItem: null };
  }

  const names = character.resources
    .filter((resource) => resource.attentionNeeded)
    .map((resource) => resource.name);

  return {
    resources,
    attentionItem: {
      id: `${character.id}:resources`,
      characterId: character.id,
      characterName: character.name,
      domain: "resources",
      severity: "this-week",
      label: "Resources need attention",
      detail:
        names.length > 0
          ? `${names.join(", ")} not complete this week`
          : null,
      path: `/characters/${character.id}`
    }
  };
}
