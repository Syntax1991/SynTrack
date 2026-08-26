import type {
  AddonProfessionCatalog,
  AddonSpecializationNode,
  AddonSpecializationTree,
  LuaTable,
  LuaValue
} from "./addon-import.types.js";
import {
  asNumber,
  asString,
  asTable,
  numericValues
} from "./addon-import.lua-utils.js";

function getEntries(
  node: LuaTable
): LuaTable[] {
  return numericValues(
    asTable(
      node.entries
    )
  )
    .map(
      asTable
    )
    .filter(
      (
        entry
      ): entry is LuaTable =>
        entry !== null
    );
}

function findEntryByType(
  entries: LuaTable[],
  type: number
): LuaTable | null {
  return (
    entries.find(
      (entry) =>
        asNumber(
          entry.type
        ) ===
        type
    ) ??
    null
  );
}

function normalizeNode(
  value: LuaValue,
  rootNodeExternalId:
    number | null,
  sortOrder: number
): AddonSpecializationNode | null {
  const node =
    asTable(
      value
    );

  if (
    !node ||
    asNumber(
      node.type
    ) !==
      1
  ) {
    return null;
  }

  const externalNodeId =
    asNumber(
      node.nodeId
    );

  if (
    externalNodeId ===
    null
  ) {
    return null;
  }

  const entries =
    getEntries(
      node
    );

  const knowledgeEntry =
    findEntryByType(
      entries,
      7
    );

  const displayEntry =
    knowledgeEntry ??
    entries[0] ??
    null;

  const directName =
    asString(
      node.name
    );

  const directDescription =
    asString(
      node.description
    );

  const directKnowledgeEntryId =
    asNumber(
      node.knowledgeEntryId
    );

  const directKnowledgeMaxRank =
    asNumber(
      node.knowledgeMaxRank
    );

  const directSpellId =
    asNumber(
      node.spellId
    );

  /*
   * Storage scope 2 flattens the display and
   * Knowledge entry onto the node. Legacy
   * entry arrays remain supported for older
   * SavedVariables uploads.
   */
  const maxRank =
    asNumber(
      node.maxRanks
    ) ??
    asNumber(
      node.totalMaxRanks
    ) ??
    asNumber(
      displayEntry?.maxRanks
    );

  return {
    externalNodeId,

    name:
      directName ??
      asString(
        displayEntry?.name
      ) ??
      `Node ${externalNodeId}`,

    description:
      directDescription ??
      asString(
        displayEntry?.description
      ),

    maxRank,

    knowledgeEntryId:
      directKnowledgeEntryId ??
      asNumber(
        knowledgeEntry?.entryId
      ),

    knowledgeMaxRank:
      directKnowledgeMaxRank ??
      asNumber(
        knowledgeEntry?.maxRanks
      ),

    spellId:
      directSpellId,

    sortOrder,

    isRoot:
      externalNodeId ===
      rootNodeExternalId
  };
}

function normalizeTree(
  value: LuaValue,
  sortOrder: number
): AddonSpecializationTree | null {
  const tree =
    asTable(
      value
    );

  if (!tree) {
    return null;
  }

  const externalTreeId =
    asNumber(
      tree.treeId
    );

  if (
    externalTreeId ===
    null
  ) {
    return null;
  }

  const rootNodeExternalId =
    asNumber(
      tree.rootNodeId
    );

  const nodes =
    numericValues(
      asTable(
        tree.nodes
      )
    )
      .map(
        (
          node,
          index
        ) =>
          normalizeNode(
            node,
            rootNodeExternalId,
            (index + 1) * 10
          )
      )
      .filter(
        (
          node
        ): node is AddonSpecializationNode =>
          node !== null
      );

  return {
    externalTreeId,

    name:
      asString(
        tree.name
      ) ??
      `Tree ${externalTreeId}`,

    description:
      asString(
        tree.description
      ),

    rootNodeExternalId,
    sortOrder,
    nodes
  };
}

export function normalizeCatalog(
  key: string,
  value: LuaValue
): AddonProfessionCatalog | null {
  const catalog =
    asTable(
      value
    );

  if (!catalog) {
    return null;
  }

  const skillLineId =
    asNumber(
      catalog.skillLineId
    ) ??
    Number(
      key
    );

  if (
    !Number.isFinite(
      skillLineId
    )
  ) {
    return null;
  }

  const trees =
    numericValues(
      asTable(
        catalog.tabs
      )
    )
      .map(
        (
          tree,
          index
        ) =>
          normalizeTree(
            tree,
            (index + 1) * 10
          )
      )
      .filter(
        (
          tree
        ): tree is AddonSpecializationTree =>
          tree !== null
      );

  return {
    skillLineId,

    displayName:
      asString(
        catalog.displayName
      ) ??
      `Skill line ${skillLineId}`,

    expansionName:
      asString(
        catalog.expansionName
      ),

    trees
  };
}