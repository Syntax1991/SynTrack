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
 * explicit alternative to a vague "Not specialized" label.
 *
 * NODE IDENTITY IS RESOLVED INDEPENDENTLY OF RANK. A slot's row always
 * points at the curated SPECIFIC node for that (family, slot) pair - a
 * bundle node (e.g. "Large Plate Armor") is never substituted just
 * because the specific node (e.g. "Chestplates") happens to be at 0 and
 * the bundle happens to be invested. Rank/maxRank are then read from
 * THAT resolved node alone, so a genuinely-uninvested specific node
 * correctly shows 0/max rather than borrowing a different node's rank -
 * showing "Chest -> Large Plate Armor 30/30" would misrepresent a
 * bundle-wide investment as if it were Chestplates' own rank, which it
 * is not. A bundle node's own real investment is not lost by this - see
 * profession-general-specialization.mapper.ts, which now surfaces any
 * node whose curated claims are ALL bundle claims (never used as a
 * pair's specific identity) under General/Profession instead.
 *
 * The bundleNodeKeys fallback exists only for the case where a pair was
 * curated with NO specific node at all (every claim for it is a bundle)
 * - there every candidate is genuinely a bundle, so the first one is the
 * only node this capability can ever point to. No currently-curated pair
 * is actually in that situation, but the fallback keeps this function
 * total rather than silently producing no row.
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
      const resolvedNodeKey =
        pair.specificNodeKey ??
        pair.bundleNodeKeys[0] ??
        null;

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

      /*
       * Whether this PAIR has been proven at all - the specific node
       * itself has rank, OR any bundle covering it does - independent of
       * which node identity is actually displayed above. This is what
       * lets the Overview distinguish "Synbeam has never touched
       * anything that grants Chest" (hide the row) from "Synbeam has
       * real Chest-relevant investment, just not in Chestplates itself"
       * (show "Chestplates 0/25" - a known node at a known, if zero,
       * rank, not a guess). The Specializations tab ignores this flag
       * entirely and always shows every pair.
       */
      const hasProvenInvestment =
        resolvedRank > 0 ||
        pair.bundleNodeKeys.some(
          (bundleNodeKey) =>
            (
              rankByNodeKey.get(
                bundleNodeKey
              ) ?? 0
            ) > 0
        );

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
          null,

        hasProvenInvestment
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
