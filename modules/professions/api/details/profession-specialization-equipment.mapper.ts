import type { ProfessionDetailRepository } from "./profession-detail.repository.js";
import {
  getSpecializationEquipmentNodesForProfession
} from "./profession-specialization-equipment.definitions.js";
import type {
  ProfessionSpecializationEquipmentClaim
} from "./profession-detail.types.js";

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
 * Every claim here is ID-derived only: progress.node.key is looked up
 * verbatim against the curated table. progress.node.name is carried
 * through purely for display (e.g. "Wonderful Wristguards") and is never
 * inspected to decide family or slot. An unmapped node contributes
 * nothing - this function cannot produce a false positive for a
 * profession/node it has no curated entry for.
 */
export function mapProfessionSpecializationEquipment(
  assignment: DetailAssignment,
  professionKey: string
): ProfessionSpecializationEquipmentClaim[] {
  const curatedNodes =
    getSpecializationEquipmentNodesForProfession(
      professionKey
    );

  const claimsByPair =
    new Map<
      string,
      ProfessionSpecializationEquipmentClaim &
        { isBundle: boolean }
    >();

  for (
    const progress of
    assignment.nodeProgress
  ) {
    const rank =
      progress.knowledgeRank ??
      progress.rank;

    if (rank <= 0) {
      continue;
    }

    const slotClaims =
      curatedNodes[
        progress.node.key
      ];

    if (!slotClaims) {
      continue;
    }

    for (
      const slotClaim of
      slotClaims
    ) {
      const pairKey =
        slotClaim.capabilityKey;

      const candidate = {
        id: pairKey,

        provenance:
          slotClaim.provenance,

        kind:
          slotClaim.kind,

        capabilityKey:
          slotClaim.capabilityKey,

        presentationGroup:
          slotClaim.presentationGroup,

        familyName:
          slotClaim.familyName,

        slotKey:
          slotClaim.slotKey,

        slotName:
          slotClaim.slotName,

        rank,

        maxRank:
          progress.node
            .knowledgeMaxRank ??
          progress.node.maxRank,

        nodeName:
          progress.node.name,

        nodeKey:
          progress.node.key,

        nodeIconUrl:
          progress.node.iconUrl,

        isBundle:
          slotClaim.isBundle
      };

      const existing =
        claimsByPair.get(
          pairKey
        );

      if (
        !existing ||
        isBetterClaim(
          candidate,
          existing
        )
      ) {
        claimsByPair.set(
          pairKey,
          candidate
        );
      }
    }
  }

  return [
    ...claimsByPair.values()
  ]
    .map(
      (
        {
          isBundle,
          ...claim
        }
      ) =>
        claim
    )
    .sort(
      compareClaims
    );
}

/*
 * When a character has invested in both a slot-specific node (e.g.
 * "Wonderful Wristguards") and the tree's multi-slot bundle node (e.g.
 * "Securely Shaped") for the same family+slot, the specific node is the
 * more legible one to display. Only fall back to comparing rank when
 * both candidates are the same kind (both specific or both bundle).
 */
function isBetterClaim(
  candidate:
    { isBundle: boolean; rank: number },
  existing:
    { isBundle: boolean; rank: number }
): boolean {
  if (
    candidate.isBundle !==
    existing.isBundle
  ) {
    return !candidate.isBundle;
  }

  return (
    candidate.rank >
    existing.rank
  );
}

function compareClaims(
  left:
    ProfessionSpecializationEquipmentClaim,
  right:
    ProfessionSpecializationEquipmentClaim
): number {
  return (
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
