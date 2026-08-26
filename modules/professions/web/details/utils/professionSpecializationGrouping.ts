import type {
  ProfessionCharacterCoverage,
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";

export type SpecializationNodeGroup = {
  nodeKey: string;
  nodeName: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
  presentationGroup: string;
  familyName: string;
  slotNames: string[];
  slotKeys: string[];
  /*
   * Parallel to slotNames/slotKeys - the real family each slot in this
   * row actually belongs to. A single node can legitimately cover slots
   * from more than one real family under one shared presentationGroup
   * (e.g. a Blacksmithing character invested only in the "Large Plate
   * Armor" bundle gets one row spanning Plate/Chest, Plate/Legs, AND
   * Shield/OFF_HAND - all under presentationGroup "Armor"), so the
   * top-level familyName field above is not reliable for anything that
   * needs the REAL family of one specific slot (e.g. a Find Craft deep
   * link) - use familyNames[index] together with slotKeys[index] instead.
   */
  familyNames: string[];
};

/*
 * specializationEquipment holds one claim PER (family, slot) pair, so a
 * single multi-slot bundle node (e.g. "Securely Shaped") appears as
 * several claims that all share the same nodeKey. Grouping by nodeKey
 * here is presentation only - it does not change what a recipe match
 * requires (still an exact family+slot claim, see
 * profession-specialization-equipment.mapper.ts) - it only stops the
 * same node from being shown to a human three or four times.
 *
 * No claim is picked as a "primary" or "focus" specialization: rank is
 * never used to choose or order which node is shown first, since a
 * higher rank does not mean a node is more central to the character.
 * Groups are ordered alphabetically by node name, a neutral, stable
 * order that carries no implied importance.
 */
export function groupSpecializationClaimsByNode(
  claims:
    ProfessionSpecializationEquipmentClaim[]
): SpecializationNodeGroup[] {
  const groupsByNodeKey =
    new Map<
      string,
      SpecializationNodeGroup
    >();

  for (
    const claim of
    claims
  ) {
    const existing =
      groupsByNodeKey.get(
        claim.nodeKey
      );

    if (existing) {
      if (
        !existing.slotNames.includes(
          claim.slotName
        )
      ) {
        existing.slotNames.push(
          claim.slotName
        );

        existing.slotKeys.push(
          claim.slotKey
        );

        existing.familyNames.push(
          claim.familyName
        );
      }

      continue;
    }

    groupsByNodeKey.set(
      claim.nodeKey,
      {
        nodeKey:
          claim.nodeKey,
        nodeName:
          claim.nodeName,
        nodeIconUrl:
          claim.nodeIconUrl,
        rank:
          claim.rank,
        maxRank:
          claim.maxRank,
        presentationGroup:
          claim.presentationGroup,
        familyName:
          claim.familyName,
        slotNames: [
          claim.slotName
        ],
        slotKeys: [
          claim.slotKey
        ],
        familyNames: [
          claim.familyName
        ]
      }
    );
  }

  return [
    ...groupsByNodeKey.values()
  ].sort(
    (left, right) =>
      left.nodeName.localeCompare(
        right.nodeName,
        "en"
      )
  );
}

export function getSpecializationNodeGroupLabel(
  group: SpecializationNodeGroup
): string {
  return (
    `${group.nodeName} ${group.rank}` +
    (
      group.maxRank !== null
        ? `/${group.maxRank}`
        : ""
    )
  );
}

export function getSpecializationNodeGroupAppliesTo(
  group: SpecializationNodeGroup
): string {
  return (
    `${group.familyName} · ${group.slotNames.join(" · ")}`
  );
}

export function getUnspecializedCharacterNames(
  characters:
    ProfessionCharacterCoverage[]
): string[] {
  return characters
    .filter(
      (coverage) =>
        coverage
          .specializationEquipment
          .length === 0
    )
    .map(
      (coverage) =>
        coverage.character.name
    )
    .sort(
      (left, right) =>
        left.localeCompare(
          right,
          "en"
        )
    );
}
