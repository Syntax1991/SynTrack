import type {
  ProfessionExplicitSlotNodeRank,
  ProfessionSlotSpecializationNode
} from "../types/professionDetail.types";

/*
 * Looks up the one relevant sub-node rank for a specific (family, slot)
 * pair - e.g. the Wrist node for Leather. explicitSlotNodeRanks always
 * has one entry per curated slot (see profession-explicit-slot-node
 * .mapper.ts on the backend), including rank: 0 for an uninvested node,
 * so this never falls back to a vague "not specialized" - it returns
 * null only when SynTrack has no curated node for this exact
 * family/slot at all (a different, honest "no data" case).
 */
export function findExplicitSlotNodeRank(
  explicitSlotNodeRanks:
    ProfessionExplicitSlotNodeRank[],
  familyName: string,
  slotKey: string
): ProfessionExplicitSlotNodeRank | null {
  return (
    explicitSlotNodeRanks.find(
      (entry) =>
        entry.familyName ===
          familyName &&
        entry.slotKey === slotKey
    ) ?? null
  );
}

export function formatSlotNodeRank(
  entry: {
    rank: number;
    maxRank: number | null;
  }
): string {
  return (
    `${entry.rank}${entry.maxRank !== null ? `/${entry.maxRank}` : ""}`
  );
}

/*
 * A rank is never meaningful without the concrete node identity it
 * belongs to - "15/20" alone doesn't say which specialization that is.
 * This always pairs the two: "Balanced Bracers 15/20".
 */
export function formatSlotSpecializationNodeLabel(
  entry: {
    nodeName: string;
    rank: number;
    maxRank: number | null;
  }
): string {
  return (
    `${entry.nodeName} ${formatSlotNodeRank(entry)}`
  );
}

/*
 * EVERY curated node relevant to a (family, slot) pair (see
 * profession-explicit-slot-node.mapper.ts's
 * mapProfessionSlotSpecializationNodes) - a slot covered by both a
 * specific node and a multi-slot bundle node returns both, each with
 * its own real rank. Never collapsed to a single value, so a rank is
 * never shown without knowing which node earned it.
 */
export function findSlotSpecializationNodes(
  slotSpecializationNodes:
    ProfessionSlotSpecializationNode[],
  familyName: string,
  slotKey: string
): ProfessionSlotSpecializationNode[] {
  return slotSpecializationNodes.filter(
    (entry) =>
      entry.familyName ===
        familyName &&
      entry.slotKey === slotKey
  );
}

export type ExplicitSlotNodeRankPresentationGroup = {
  presentationGroup: string;
  slots: ProfessionExplicitSlotNodeRank[];
};

/*
 * Groups the always-complete, zero-inclusive slot list by presentation
 * group for display - e.g. Specializations' equipment coverage section.
 * presentationGroup defaults to familyName (so Leatherworking still
 * groups by Leather/Mail, Jewelcrafting by Jewelry), but a profession can
 * explicitly group multiple distinct families under one shared heading -
 * e.g. Blacksmithing's Plate and Shield claims both carry
 * presentationGroup: "Armor" (see
 * profession-specialization-equipment.blacksmithing.definitions.ts) so
 * they render together, even though they remain genuinely different
 * families in the underlying data. Slots stay in the backend's
 * already-sorted order (alphabetical by slot name) within each group.
 */
export function groupExplicitSlotNodeRanksByFamily(
  explicitSlotNodeRanks:
    ProfessionExplicitSlotNodeRank[]
): ExplicitSlotNodeRankPresentationGroup[] {
  const groupsByPresentationGroup =
    new Map<
      string,
      ProfessionExplicitSlotNodeRank[]
    >();

  for (
    const entry of
    explicitSlotNodeRanks
  ) {
    const existing =
      groupsByPresentationGroup.get(
        entry.presentationGroup
      );

    if (existing) {
      existing.push(entry);
      continue;
    }

    groupsByPresentationGroup.set(
      entry.presentationGroup,
      [entry]
    );
  }

  return [
    ...groupsByPresentationGroup.entries()
  ]
    .map(
      ([presentationGroup, slots]) => ({
        presentationGroup,
        slots
      })
    )
    .sort(
      (left, right) =>
        left.presentationGroup.localeCompare(
          right.presentationGroup,
          "en"
        )
    );
}
