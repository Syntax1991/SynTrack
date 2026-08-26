/*
 * Developer/audit tool - NOT end-user UI.
 *
 * For every profession's real captured specialization tree nodes (the
 * live dev database, not fixtures), reports whether that node currently
 * has a curated CURATED_VERIFIED capability mapping
 * (profession-specialization-equipment.<profession>.definitions.ts) and,
 * for unmapped nodes, every real character currently invested in it. This
 * is the deterministic workflow the mapping-architecture doc describes:
 * SynTrack captures exact node IDs -> this script reports which ones have
 * no curated mapping yet -> the project owner checks the node in the
 * live WoW UI -> an explicit ID mapping is added to the profession's
 * definitions file -> a test locks it down.
 *
 * Node identity: only `key` (the addon:<nodeId> Blizzard C_Traits node
 * ID) and `spellId` are ever persisted - entryId/definitionId are
 * captured by the addon (SpecializationEntries.lua) but are NOT written
 * to ProfessionSpecializationNode today, so they cannot be reported here.
 * See docs/architecture/profession-specialization-mapping.md for why
 * nodeId alone is the correct, sufficient identifier for every node
 * captured so far.
 *
 * Run via tsx (not the built dist output) so it always reflects the
 * current schema/code without requiring a fresh build first - see
 * package.json's "audit:unmapped-specialization-nodes" script.
 */
import { prisma } from "../src/infrastructure/database/prismaClient.js";
import {
  getSpecializationEquipmentNodesForProfession,
  professionsWithSpecializationEquipmentMapping
} from "../../../modules/professions/api/details/profession-specialization-equipment.definitions.js";

async function main() {
  const professions = await prisma.profession.findMany({
    orderBy: { order: "asc" },
    select: {
      key: true,
      name: true,
      specializationTrees: {
        where: { expansion: "MIDNIGHT" },
        select: {
          name: true,
          nodes: {
            select: {
              key: true,
              name: true,
              description: true,
              parentNodeId: true,
              maxRank: true,
              knowledgeMaxRank: true,
              spellId: true,
              progress: {
                where: {
                  OR: [
                    { rank: { gt: 0 } },
                    { knowledgeRank: { gt: 0 } }
                  ]
                },
                select: {
                  rank: true,
                  knowledgeRank: true,
                  characterProfession: {
                    select: {
                      character: {
                        select: { name: true, realm: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const summary: {
    profession: string;
    mappedCount: number;
    unmappedCount: number;
  }[] = [];

  for (const profession of professions) {
    const curatedNodes = getSpecializationEquipmentNodesForProfession(
      profession.key
    );

    const hasAnyMapping =
      professionsWithSpecializationEquipmentMapping.has(profession.key);

    const nodes = profession.specializationTrees.flatMap((tree) =>
      tree.nodes.map((node) => ({ tree, node }))
    );

    if (nodes.length === 0) continue;

    console.log("=".repeat(70));
    console.log(
      `${profession.name} (${profession.key}) - curated mapping registered: ${hasAnyMapping}`
    );

    let mappedCount = 0;
    let unmappedCount = 0;

    for (const { tree, node } of nodes) {
      const isRoot = node.parentNodeId === null;
      const isMapped = Boolean(curatedNodes[node.key]);

      if (isMapped) {
        mappedCount += 1;
      } else {
        unmappedCount += 1;
      }

      const maxRank = node.knowledgeMaxRank ?? node.maxRank;
      const investedBy = node.progress.map((progress) => {
        const rank = progress.knowledgeRank ?? progress.rank;
        const character = progress.characterProfession.character;
        return `${character.name}-${character.realm} (${rank}/${maxRank ?? "?"})`;
      });

      console.log(
        `  [${isMapped ? "MAPPED  " : "UNMAPPED"}]${isRoot ? " [ROOT]" : "       "} ${node.key} "${node.name}" (tree: ${tree.name}, max ${maxRank ?? "?"}, spellId ${node.spellId ?? "none"})`
      );

      if (!isMapped && investedBy.length > 0) {
        console.log(`             invested by: ${investedBy.join(", ")}`);
      }
    }

    console.log(`  -- ${mappedCount} mapped, ${unmappedCount} unmapped --`);

    summary.push({
      profession: profession.name,
      mappedCount,
      unmappedCount
    });
  }

  console.log("=".repeat(70));
  console.log("SUMMARY");
  for (const entry of summary) {
    console.log(
      `  ${entry.profession}: ${entry.mappedCount} mapped, ${entry.unmappedCount} unmapped`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
