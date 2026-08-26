import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import type {
  ProfessionGeneralSpecializationEntry
} from "./profession-detail.types.js";
import { getSpecializationEquipmentNodesForProfession } from "./profession-specialization-equipment.definitions.js";

type DetailRecord =
  NonNullable<
    Awaited<
      ReturnType<
        ProfessionDetailRepository["findById"]
      >
    >
  >;

type DetailAssignment =
  DetailRecord["assignments"][number];

/*
 * Every invested node that is never used as a curated pair's SPECIFIC
 * identity - not just tree ROOT nodes, and not just nodes with zero
 * curated claims. Root nodes ("Flawless Fortes 30/30", "Learned
 * Leatherworker 8/30", "Weaponsmithing 30/30") are always uncurated by
 * convention and always qualified. A non-root node that is ALSO
 * genuinely uncurated - e.g. Blacksmithing's "Resourceful Smith" under
 * "The Old Ways," a general crafting-bonus leaf, not an equipment/weapon
 * node - must not become invisible just because it happens to sit one
 * level deeper than a root.
 *
 * A curated BUNDLE-only node (e.g. "Large Plate Armor," "Sculpted
 * Armor," "Articulating Armor" - every claim they carry has
 * isBundle: true) also belongs here now. profession-explicit-slot-node
 * .mapper.ts's slot rows always resolve to the pair's SPECIFIC node
 * identity, never substituting a bundle's rank for it - so a bundle
 * node's own real investment ("Large Plate Armor 30/30") would
 * otherwise vanish entirely once it stops being any slot's displayed
 * rank. A node is excluded here only when it is used as at least one
 * pair's specific identity (isBundle: false) - it is properly
 * represented by its own slot row in that case, and showing it again
 * here would duplicate it.
 *
 * A character's real investment is never silently dropped: if a node
 * has no curated claim, or only bundle claims, it surfaces here
 * instead, with its own real name and rank, never a guessed capability.
 * This is what lets a character with only generalist-tree investment
 * (e.g. Synbomb, or Synlight's Resourceful Smith) be shown accurately
 * instead of as "not specialized" or, worse, not shown at all.
 */
export function mapProfessionGeneralSpecialization(
  assignment: DetailAssignment,
  professionKey: string
): ProfessionGeneralSpecializationEntry[] {
  const curatedNodes =
    getSpecializationEquipmentNodesForProfession(
      professionKey
    );

  const entries:
    ProfessionGeneralSpecializationEntry[] =
    [];

  for (
    const progress of
    assignment.nodeProgress
  ) {
    const claimsForNode =
      curatedNodes[
        progress.node.key
      ];

    const isUsedAsSpecificIdentity =
      claimsForNode?.some(
        (claim) => !claim.isBundle
      ) ??
      false;

    if (isUsedAsSpecificIdentity) {
      continue;
    }

    const rank =
      progress.knowledgeRank ??
      progress.rank;

    if (rank <= 0) {
      continue;
    }

    entries.push({
      nodeKey:
        progress.node.key,

      nodeName:
        progress.node.name,

      nodeIconUrl:
        progress.node.iconUrl,

      rank,

      maxRank:
        progress.node
          .knowledgeMaxRank ??
        progress.node.maxRank
    });
  }

  return entries.sort(
    (left, right) =>
      left.nodeName.localeCompare(
        right.nodeName,
        "en"
      )
  );
}
