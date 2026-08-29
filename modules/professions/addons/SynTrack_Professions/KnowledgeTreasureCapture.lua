local _, PT = ...

--[[
    Permanent Knowledge Treasure completion via the persistent
    per-character quest flag - same evidence type as Weekly Quest/
    Treatise (C_QuestLog.IsQuestFlaggedCompleted, deliberately NOT the
    unreliable OnAccount variant), but each treasure is its own single
    quest id (no "any one of N candidates" alternation, unlike weekly
    gathering professions' multi-candidate quests).
]]

local function captureTreasure(sourceKey, questId)
    local succeeded, flagged =
        pcall(
            C_QuestLog.IsQuestFlaggedCompleted,
            questId
        )

    local flaggedCompleted = nil

    if succeeded then
        flaggedCompleted = flagged
            == true
    end

    return {
        sourceKey = sourceKey,
        externalQuestId = questId,
        flaggedCompleted = flaggedCompleted
    }
end

local function captureProfessionEntry(
    professionName,
    questIds
)
    local sources = {}

    for index, questId in ipairs(questIds) do
        table.insert(
            sources,
            captureTreasure(
                "treasure-" .. index,
                questId
            )
        )
    end

    return {
        professionName = professionName,
        sources = sources
    }
end

--[[
    Returns nil (not an empty snapshot) when the character has no
    profession matching a known catalog entry, or when C_QuestLog isn't
    available - absence must never be confused with "confirmed nothing
    to report".
]]
function PT.CaptureProfessionKnowledgeTreasures(professions)
    if not C_QuestLog
        or not C_QuestLog.IsQuestFlaggedCompleted
    then
        return nil
    end

    local entries = {}

    for _, profession in ipairs(
        professions or {}
    ) do
        local key =
            PT.NormalizeKeyPart(
                profession.name
            )

        local questIds =
            PT.KnowledgeTreasureCatalog[key]

        if questIds then
            table.insert(
                entries,
                captureProfessionEntry(
                    profession.name,
                    questIds
                )
            )
        end
    end

    if #entries == 0 then
        return nil
    end

    return {
        schemaVersion = 1,
        capturedAt = time(),
        professions = entries
    }
end
