import type {
  DetailAssignment,
  SpecializationNodeCatalogEntry
} from "./profession-specialization-node-catalog.helpers.js";
import {
  buildRankByNodeKey,
  getSlotNodeCandidatesByPair
} from "./profession-specialization-node-catalog.helpers.js";
import type {
  ProfessionSlotSpecializationNode
} from "./profession-detail.types.js";

/*
 * EVERY curated node relevant to a (family, slot) pair, one entry per
 * (pair, node) - never collapsed to a single "resolved" value. A rank
 * is never shown without the concrete node name/identity that earned
 * it: a naked "15/20" is meaningless, but "Balanced Bracers 15/20" is
 * not. When a slot is covered by both a specific node (e.g. "Balanced
 * Bracers") and a multi-slot bundle node (e.g. "Bolstered Bulwarks"),
 * BOTH are included with their own real rank - a character can
 * genuinely be invested in both at once, and a bundle-only investment
 * must never be hidden just because the specific node happens to be at
 * 0. This is what Browse's per-slot candidate summary uses.
 */
export function mapProfessionSlotSpecializationNodes(
  assignment: DetailAssignment,
  nodeCatalog: Map<
    string,
    SpecializationNodeCatalogEntry
  >,
  professionKey: string
): ProfessionSlotSpecializationNode[] {
  const rankByNodeKey =
    buildRankByNodeKey(assignment);

  const entries: ProfessionSlotSpecializationNode[] =
    [];

  for (
    const pair of
    getSlotNodeCandidatesByPair(
      professionKey
    ).values()
  ) {
    const nodeKeys = [
      pair.specificNodeKey,
      ...pair.bundleNodeKeys
    ].filter(
      (
        nodeKey
      ): nodeKey is string =>
        nodeKey !== null
    );

    for (
      const nodeKey of
      nodeKeys
    ) {
      const catalogNode =
        nodeCatalog.get(nodeKey);

      entries.push({
        capabilityKey:
          pair.capabilityKey,
        presentationGroup:
          pair.presentationGroup,
        familyName:
          pair.familyName,
        slotKey: pair.slotKey,
        slotName: pair.slotName,
        nodeKey,

        nodeName:
          catalogNode?.name ??
          nodeKey,

        nodeIconUrl:
          catalogNode?.iconUrl ??
          null,

        rank:
          rankByNodeKey.get(
            nodeKey
          ) ?? 0,

        maxRank:
          catalogNode?.maxRank ??
          null
      });
    }
  }

  return entries.sort(
    (left, right) =>
      left.familyName.localeCompare(
        right.familyName,
        "en"
      ) ||
      left.slotName.localeCompare(
        right.slotName,
        "en"
      ) ||
      left.nodeName.localeCompare(
        right.nodeName,
        "en"
      )
  );
}
