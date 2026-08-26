import type {
  DetailAssignment,
  SpecializationNodeCatalogEntry
} from "./profession-specialization-node-catalog.helpers.js";
import {
  buildRankByNodeKey,
  getSlotNodeCandidatesByPair
} from "./profession-specialization-node-catalog.helpers.js";
import type {
  ProfessionExplicitSlotNodeRank
} from "./profession-detail.types.js";

export {
  buildSpecializationNodeCatalog
} from "./profession-specialization-node-catalog.helpers.js";
export type {
  SpecializationNodeCatalogEntry
} from "./profession-specialization-node-catalog.helpers.js";

/*
 * One entry per curated (family, slot) pair, ALWAYS - including 0/max
 * for a slot the character has no investment in at all. This is the
 * explicit alternative to a vague "Not specialized" label: rank/nodeName
 * are looked up from the character's actual node progress when it
 * exists (preferring the specific node when it's invested, falling back
 * to a bundle node the character invested in instead - the same
 * specific-over-bundle preference profession-specialization-equipment
 * .mapper.ts already uses for claims), and rank defaults to 0 (never
 * inferred/guessed) only once neither node has any investment. maxRank
 * comes only from the real node catalog, never a hardcoded number.
 *
 * This single "resolved" node per slot is what Specializations (and the
 * Overview) show, where showing one line per slot is the point. Browse's
 * per-slot summary needs something different (every relevant node, not
 * a collapsed one) - see profession-slot-specialization-nodes.mapper.ts.
 */
export function mapProfessionExplicitSlotNodeRanks(
  assignment: DetailAssignment,
  nodeCatalog: Map<
    string,
    SpecializationNodeCatalogEntry
  >,
  professionKey: string
): ProfessionExplicitSlotNodeRank[] {
  const rankByNodeKey =
    buildRankByNodeKey(assignment);

  const entries = [
    ...getSlotNodeCandidatesByPair(
      professionKey
    ).values()
  ].map(
    (pair) => {
      const specificRank =
        pair.specificNodeKey
          ? rankByNodeKey.get(
              pair.specificNodeKey
            ) ?? 0
          : 0;

      const investedBundleNodeKey =
        pair.bundleNodeKeys.find(
          (bundleNodeKey) =>
            (
              rankByNodeKey.get(
                bundleNodeKey
              ) ?? 0
            ) > 0
        );

      /*
       * Prefer the specific node whenever it has real investment;
       * otherwise use an invested bundle node if one exists; otherwise
       * fall back to the specific node's own (zero) identity, since
       * every curated slot has one.
       */
      const resolvedNodeKey =
        specificRank > 0
          ? pair.specificNodeKey
          : (
              investedBundleNodeKey ??
              pair.specificNodeKey ??
              pair.bundleNodeKeys[0] ??
              null
            );

      const resolvedRank =
        resolvedNodeKey
          ? rankByNodeKey.get(
              resolvedNodeKey
            ) ?? 0
          : 0;

      const catalogNode =
        resolvedNodeKey
          ? nodeCatalog.get(
              resolvedNodeKey
            )
          : undefined;

      return {
        capabilityKey:
          pair.capabilityKey,
        presentationGroup:
          pair.presentationGroup,
        familyName:
          pair.familyName,
        slotKey: pair.slotKey,
        slotName: pair.slotName,

        nodeKey:
          resolvedNodeKey ?? "",

        nodeName:
          catalogNode?.name ??
          pair.slotName,

        nodeIconUrl:
          catalogNode?.iconUrl ??
          null,

        rank: resolvedRank,

        maxRank:
          catalogNode?.maxRank ??
          null
      };
    }
  );

  return entries.sort(
    (left, right) =>
      left.familyName.localeCompare(
        right.familyName,
        "en"
      ) ||
      left.slotName.localeCompare(
        right.slotName,
        "en"
      )
  );
}
