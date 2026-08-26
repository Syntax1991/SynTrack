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
 * Every invested node that has NO curated equipment/weapon/craft-category
 * claim (see profession-specialization-equipment.<profession>.definitions
 * .ts) - not just tree ROOT nodes. Root nodes ("Flawless Fortes 30/30",
 * "Learned Leatherworker 8/30", "Weaponsmithing 30/30") are always
 * uncurated by convention (curated claims only ever target the specific/
 * bundle nodes beneath a root), so they always qualified before and still
 * do. But a non-root node that is ALSO genuinely uncurated - e.g.
 * Blacksmithing's "Resourceful Smith" under "The Old Ways," a general
 * crafting-bonus leaf, not an equipment/weapon node - must not become
 * invisible just because it happens to sit one level deeper than a root.
 * A character's real investment is never silently dropped: if a node has
 * no curated claim anywhere, it surfaces here instead, with its own real
 * name and rank, never a guessed capability. This is what lets a
 * character with only generalist-tree investment (e.g. Synbomb, or
 * Synlight's Resourceful Smith) be shown accurately instead of as "not
 * specialized" or, worse, not shown at all.
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
    if (
      curatedNodes[
        progress.node.key
      ]
    ) {
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
