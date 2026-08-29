local _, PT = ...

--[[
    Weekly Profession Quest + Treatise + Knowledge Drops completion via
    the persistent per-character quest flag - deliberately NOT
    IsQuestFlaggedCompletedOnAccount (documented as unreliable/stale-true
    for this exact use, see the audit) and NOT bag-item possession
    (a Treatise item disappears on use; the flag doesn't). Knowledge
    Drops is captured as a series of independent hidden-quest "slots"
    (see ProfessionWeeklyCatalog.lua) using the exact same any-one-
    candidate-flagged evaluation as Weekly Quest/Treatise - it is NOT a
    currency-based count.
]]

local function anyQuestFlagged(questIds)
    for _, questId in ipairs(questIds) do
        local succeeded, flagged =
            pcall(
                C_QuestLog.IsQuestFlaggedCompleted,
                questId
            )

        if succeeded and flagged then
            return true, questId
        end
    end

    return false, questIds[1]
end

local function captureSource(sourceKey, questIds)
    local flaggedCompleted, representativeQuestId =
        anyQuestFlagged(questIds)

    return {
        sourceKey = sourceKey,
        externalQuestId = representativeQuestId,
        flaggedCompleted = flaggedCompleted
    }
end

local function captureProfessionEntry(
    professionName,
    catalogEntry
)
    local sources = {}

    if catalogEntry.weeklyQuest then
        table.insert(
            sources,
            captureSource(
                "weekly-quest",
                catalogEntry.weeklyQuest
            )
        )
    end

    if catalogEntry.treatise then
        table.insert(
            sources,
            captureSource(
                "treatise",
                catalogEntry.treatise
            )
        )
    end

    if catalogEntry.knowledgeDrops then
        for slotIndex, candidateIds in ipairs(
            catalogEntry.knowledgeDrops
        ) do
            table.insert(
                sources,
                captureSource(
                    "knowledge-drops-"
                        .. slotIndex,
                    candidateIds
                )
            )
        end
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
function PT.CaptureProfessionWeekly(professions)
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

        local catalogEntry =
            PT.ProfessionWeeklyCatalog[key]

        if catalogEntry then
            table.insert(
                entries,
                captureProfessionEntry(
                    profession.name,
                    catalogEntry
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
