import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { inferProfessionKeyFromCatalog } from "./addon-import.normalizer.js";
import {
  createExpansionKey,
  createNodeKey,
  createNodeMapKey,
  createTreeKey
} from "./addon-import.persistence-utils.js";
import type {
  AddonImportTransaction,
  CatalogPersistenceResult,
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type {
  AddonProfessionCatalog,
  AddonSnapshot,
  AddonSpecializationTree
} from "./addon-import.types.js";

export class AddonCatalogPersistence {
  async persist(
    transaction:
      AddonImportTransaction,
    snapshot:
      AddonSnapshot,
    professionIds:
      ProfessionIdMap
  ): Promise<CatalogPersistenceResult> {
    const result:
      CatalogPersistenceResult = {
        catalogs: 0,
        trees: 0,
        nodes: 0,
        nodeIds:
          new Map()
      };

    for (
      const catalog of
      snapshot.catalogs
    ) {
      const professionKey =
        inferProfessionKeyFromCatalog(
          catalog,
          snapshot
        );

      if (!professionKey) {
        throw new AppError(
          400,
          `Beruf für Skill-Line ${catalog.skillLineId} konnte nicht bestimmt werden.`
        );
      }

      const professionId =
        professionIds.get(
          professionKey
        );

      if (!professionId) {
        throw new AppError(
          400,
          `Beruf "${professionKey}" fehlt in der Datenbank.`
        );
      }

      await this.persistCatalog(
        transaction,
        catalog,
        professionId,
        result
      );

      result.catalogs += 1;
    }

    return result;
  }

  private async persistCatalog(
    transaction:
      AddonImportTransaction,
    catalog:
      AddonProfessionCatalog,
    professionId: string,
    result:
      CatalogPersistenceResult
  ): Promise<void> {
    const expansion =
      createExpansionKey(
        catalog.expansionName,
        catalog.skillLineId
      );

    for (
      const tree of
      catalog.trees
    ) {
      await this.persistTree(
        transaction,
        catalog,
        tree,
        professionId,
        expansion,
        result
      );

      result.trees += 1;
    }
  }

  private async persistTree(
    transaction:
      AddonImportTransaction,
    catalog:
      AddonProfessionCatalog,
    tree:
      AddonSpecializationTree,
    professionId: string,
    expansion: string,
    result:
      CatalogPersistenceResult
  ): Promise<void> {
    const treeKey =
      createTreeKey(
        catalog.skillLineId,
        tree.externalTreeId
      );

    const storedTree =
      await transaction
        .professionSpecializationTree
        .upsert({
          where: {
            professionId_expansion_key: {
              professionId,
              expansion,
              key:
                treeKey
            }
          },

          create: {
            professionId,
            expansion,
            key:
              treeKey,
            name:
              tree.name,
            description:
              tree.description,
            sortOrder:
              tree.sortOrder
          },

          update: {
            name:
              tree.name,
            description:
              tree.description,
            sortOrder:
              tree.sortOrder
          }
        });

    let rootNodeId:
      string | null = null;

    const storedNodes:
      {
        id: string;
        externalNodeId: number;
        isRoot: boolean;
      }[] = [];

    for (
      const node of
      tree.nodes
    ) {
      const storedNode =
        await transaction
          .professionSpecializationNode
          .upsert({
            where: {
              treeId_key: {
                treeId:
                  storedTree.id,

                key:
                  createNodeKey(
                    node.externalNodeId
                  )
              }
            },

            create: {
              treeId:
                storedTree.id,

              parentNodeId:
                null,

              key:
                createNodeKey(
                  node.externalNodeId
                ),

              name:
                node.name,

              description:
                node.description,

              maxRank:
                node.maxRank,

              knowledgeMaxRank:
                node.knowledgeMaxRank,

              spellId:
                node.spellId,

              sortOrder:
                node.sortOrder
            },

            update: {
              parentNodeId:
                null,

              name:
                node.name,

              description:
                node.description,

              maxRank:
                node.maxRank,

              knowledgeMaxRank:
                node.knowledgeMaxRank,

              spellId:
                node.spellId,

              sortOrder:
                node.sortOrder
            }
          });

      storedNodes.push({
        id:
          storedNode.id,

        externalNodeId:
          node.externalNodeId,

        isRoot:
          node.isRoot
      });

      if (node.isRoot) {
        rootNodeId =
          storedNode.id;
      }

      result.nodeIds.set(
        createNodeMapKey(
          catalog.skillLineId,
          tree.externalTreeId,
          node.externalNodeId
        ),
        storedNode.id
      );

      result.nodes += 1;
    }

    if (!rootNodeId) {
      return;
    }

    for (
      const storedNode of
      storedNodes
    ) {
      if (
        storedNode.id ===
        rootNodeId
      ) {
        continue;
      }

      await transaction
        .professionSpecializationNode
        .update({
          where: {
            id:
              storedNode.id
          },

          data: {
            parentNodeId:
              rootNodeId
          }
        });
    }
  }
}