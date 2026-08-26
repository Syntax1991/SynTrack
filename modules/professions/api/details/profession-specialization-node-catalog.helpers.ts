import { getSpecializationEquipmentNodesForProfession } from "./profession-specialization-equipment.definitions.js";
import type { ProfessionDetailRepository } from "./profession-detail.repository.js";

type DetailRecord =
  NonNullable<
    Awaited<
      ReturnType<
        ProfessionDetailRepository["findById"]
      >
    >
  >;

export type DetailAssignment =
  DetailRecord["assignments"][number];

export type SpecializationTree =
  DetailRecord["specializationTrees"][number];

export type SpecializationNodeCatalogEntry = {
  name: string;
  maxRank: number | null;
  iconUrl: string | null;
};

/*
 * key -> {name, maxRank}, for every node in every specialization tree of
 * this profession - not just nodes a character has invested in. This is
 * the only place "0/max" for an uninvested node can come from, since the
 * addon never writes a progress row for a zero-rank node.
 */
export function buildSpecializationNodeCatalog(
  specializationTrees:
    SpecializationTree[]
): Map<
  string,
  SpecializationNodeCatalogEntry
> {
  const catalog =
    new Map<
      string,
      SpecializationNodeCatalogEntry
    >();

  for (
    const tree of
    specializationTrees
  ) {
    for (
      const node of
      tree.nodes
    ) {
      catalog.set(
        node.key,
        {
          name: node.name,
          maxRank:
            node.knowledgeMaxRank ??
            node.maxRank,
          iconUrl: node.iconUrl
        }
      );
    }
  }

  return catalog;
}

export type SlotNodeCandidates = {
  capabilityKey: string;
  presentationGroup: string;
  familyName: string;
  slotKey: string;
  slotName: string;
  specificNodeKey: string | null;
  bundleNodeKeys: string[];
};

/*
 * For each curated (family, slot) pair, every node key that can grant it
 * - the one SPECIFIC node (e.g. "Wonderful Wristguards" for
 * Leather/Wrist) and any multi-slot BUNDLE node that also covers it
 * (e.g. "Securely Shaped"). A character can be invested in either one -
 * a bundle-only investment must still show real coverage for that slot,
 * not a false 0/max.
 */
export function getSlotNodeCandidatesByPair(
  professionKey: string
): Map<
  string,
  SlotNodeCandidates
> {
  const byPair =
    new Map<
      string,
      SlotNodeCandidates
    >();

  for (
    const [
      nodeKey,
      claims
    ] of Object.entries(
      getSpecializationEquipmentNodesForProfession(
        professionKey
      )
    )
  ) {
    for (
      const claim of
      claims
    ) {
      const pairKey =
        claim.capabilityKey;

      const existing =
        byPair.get(pairKey);

      const entry: SlotNodeCandidates =
        existing ?? {
          capabilityKey:
            claim.capabilityKey,
          presentationGroup:
            claim.presentationGroup,
          familyName:
            claim.familyName,
          slotKey: claim.slotKey,
          slotName: claim.slotName,
          specificNodeKey: null,
          bundleNodeKeys: []
        };

      if (claim.isBundle) {
        entry.bundleNodeKeys.push(
          nodeKey
        );
      }
      else {
        entry.specificNodeKey =
          nodeKey;
      }

      byPair.set(pairKey, entry);
    }
  }

  return byPair;
}

export function buildRankByNodeKey(
  assignment: DetailAssignment
): Map<string, number> {
  const rankByNodeKey =
    new Map<string, number>();

  for (
    const progress of
    assignment.nodeProgress
  ) {
    rankByNodeKey.set(
      progress.node.key,
      progress.knowledgeRank ??
        progress.rank
    );
  }

  return rankByNodeKey;
}
