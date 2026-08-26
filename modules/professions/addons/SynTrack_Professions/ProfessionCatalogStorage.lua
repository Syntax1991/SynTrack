local _, PT = ...

local KNOWLEDGE_ENTRY_TYPE = 7

local function findEntryByType(
    entries,
    expectedType
)
    for _, entry in ipairs(
        entries
        or {}
    ) do
        if type(entry) == "table"
            and entry.type == expectedType
        then
            return entry
        end
    end

    return nil
end

local function getFirstEntry(
    entries
)
    for _, entry in ipairs(
        entries
        or {}
    ) do
        if type(entry) == "table" then
            return entry
        end
    end

    return nil
end

local function createCompactNode(
    node
)
    if type(node) ~= "table"
        or not node.nodeId
    then
        return nil
    end

    local entries =
        node.entries
        or {}

    local knowledgeEntry =
        findEntryByType(
            entries,
            KNOWLEDGE_ENTRY_TYPE
        )

    local displayEntry =
        knowledgeEntry
        or getFirstEntry(
            entries
        )

    return {
        nodeId =
            node.nodeId,

        type =
            node.type,

        maxRanks =
            node.maxRanks
            or node.totalMaxRanks
            or (
                displayEntry
                and displayEntry.maxRanks
            )
            or 0,

        name =
            node.name
            or (
                displayEntry
                and displayEntry.name
            )
            or nil,

        description =
            node.description
            or (
                displayEntry
                and displayEntry.description
            )
            or nil,

        knowledgeEntryId =
            node.knowledgeEntryId
            or (
                knowledgeEntry
                and knowledgeEntry.entryId
            )
            or nil,

        knowledgeMaxRank =
            node.knowledgeMaxRank
            or (
                knowledgeEntry
                and knowledgeEntry.maxRanks
            )
            or nil,

        --[[
            The node's spell ID (never the raw icon fileID, which
            Blizzard's public web APIs cannot resolve into a URL). This
            is the one stable, ID-backed handle SynTrack's backend can
            use to look up the node's real spell icon later via
            Blizzard's Spell Media API - never inferred from name or
            description.
        ]]
        spellId =
            displayEntry
            and displayEntry.spellId
            or nil
    }
end

local function createCompactNodes(
    nodes
)
    local result = {}

    for _, node in ipairs(
        nodes
        or {}
    ) do
        local compactNode =
            createCompactNode(
                node
            )

        if compactNode then
            table.insert(
                result,
                compactNode
            )
        end
    end

    return result
end

local function createCompactTab(
    tab
)
    if type(tab) ~= "table"
        or not tab.treeId
    then
        return nil
    end

    return {
        treeId =
            tab.treeId,

        name =
            tab.name,

        description =
            tab.description,

        rootNodeId =
            tab.rootNodeId,

        nodes =
            createCompactNodes(
                tab.nodes
            )
    }
end

local function createCompactTabs(
    tabs
)
    local result = {}

    for _, tab in ipairs(
        tabs
        or {}
    ) do
        local compactTab =
            createCompactTab(
                tab
            )

        if compactTab then
            table.insert(
                result,
                compactTab
            )
        end
    end

    return result
end

function PT.CreateCompactProfessionCatalog(
    source
)
    if type(source) ~= "table"
        or not source.skillLineId
    then
        return nil
    end

    return {
        skillLineId =
            source.skillLineId,

        displayName =
            source.displayName,

        expansionName =
            source.expansionName,

        parentSkillLineId =
            source.parentSkillLineId,

        parentProfessionName =
            source.parentProfessionName,

        tabs =
            createCompactTabs(
                source.tabs
            ),

        updatedAt =
            source.updatedAt
            or source.capturedAt
            or time()
    }
end