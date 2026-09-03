local _, private = ...
local API = private.API

--[[
    Weeklies tracker signals consumed by the web Weeklies matrix:
    - current-season Mythic+ rating (2K milestone)
    - Trovehunter's Bounty weekly usage flag
    - weekly Meta / Spark quest completion (OR of catalog alternatives)
]]

local CATALOG = private.WeekliesSignalsCatalog

--[[
    any true → complete
    all known false → incomplete
    no true + any unresolved → unknown (nil)
]]
local function resolveAnyQuestCompleted(questIds)
    local knownFalseCount = 0
    local firstFalseId = nil

    for _, questId in ipairs(questIds) do
        local succeeded, flagged = pcall(
            C_QuestLog.IsQuestFlaggedCompleted,
            questId
        )

        if succeeded and type(flagged) == "boolean" then
            if flagged then
                return true, questId
            end

            knownFalseCount = knownFalseCount + 1
            firstFalseId = firstFalseId or questId
        end
    end

    if knownFalseCount == #questIds and #questIds > 0 then
        return false, firstFalseId
    end

    return nil, firstFalseId or questIds[1]
end

local function captureQuestEvidence(questIds)
    local evidence = {}

    for _, questId in ipairs(questIds) do
        local succeeded, flagged = pcall(
            C_QuestLog.IsQuestFlaggedCompleted,
            questId
        )

        if succeeded and type(flagged) == "boolean" then
            evidence[questId] = flagged
        else
            evidence[questId] = nil
        end
    end

    return evidence
end

local function captureMythicPlusRating()
    if C_ChallengeMode
        and C_ChallengeMode.GetOverallDungeonScore
    then
        local succeeded, score = pcall(
            C_ChallengeMode.GetOverallDungeonScore
        )

        if succeeded and type(score) == "number" then
            return {
                captured = true,
                seasonRating = math.floor(score)
            }
        end
    end

    if C_PlayerInfo
        and C_PlayerInfo.GetPlayerMythicPlusRatingSummary
    then
        local succeeded, summary = pcall(
            C_PlayerInfo.GetPlayerMythicPlusRatingSummary,
            "player"
        )

        if succeeded
            and type(summary) == "table"
            and type(summary.currentSeasonScore) == "number"
        then
            return {
                captured = true,
                seasonRating =
                    math.floor(summary.currentSeasonScore)
            }
        end
    end

    return { captured = false }
end

local function captureSingleQuestSignal(signalKey, questIds)
    local flaggedCompleted, representativeQuestId =
        resolveAnyQuestCompleted(questIds)

    return {
        signalKey = signalKey,
        externalQuestId = representativeQuestId,
        flaggedCompleted = flaggedCompleted
    }
end

local function captureMetaQuestSignal(questIds)
    local flaggedCompleted, determiningQuestId =
        resolveAnyQuestCompleted(questIds)

    return {
        signalKey = "meta-quest",
        externalQuestId = determiningQuestId,
        flaggedCompleted = flaggedCompleted,
        evidence = captureQuestEvidence(questIds)
    }
end

local function captureWeekliesSignals()
    return {
        mythicPlusRating = captureMythicPlusRating(),
        troveHuntersBountyUsed = captureSingleQuestSignal(
            "trove-hunters-bounty-used",
            CATALOG.troveHuntersBountyUsed.questIds
        ),
        metaQuest = captureMetaQuestSignal(
            CATALOG.metaQuest.questIds
        )
    }
end

local function registerWeekliesSignalsModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "weeklies-signals",
            name = "Weeklies Signals",
            version = "0.2.0",
            schemaVersion = 2,
            scope = "character",
            capture = captureWeekliesSignals
        })

    if not succeeded then
        API.Print(
            "Weeklies Signals registration failed: "
                .. tostring(errorMessage)
        )
    end
end

registerWeekliesSignalsModule()

local recaptureTimer = nil

local function scheduleRecapture(reason, delaySec)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(
        delaySec or 0.5,
        function()
            recaptureTimer = nil
            API.CaptureModule("weeklies-signals", reason)
        end
    )
end

API.Subscribe(
    "SYNTRACK_CORE_READY",
    function()
        API.CaptureModule(
            "weeklies-signals",
            "addon-loaded"
        )
    end
)

local frame = CreateFrame("Frame")

frame:RegisterEvent("PLAYER_ENTERING_WORLD")
frame:RegisterEvent("QUEST_TURNED_IN")
frame:RegisterEvent("QUEST_ACCEPTED")
frame:RegisterEvent("QUEST_LOG_UPDATE")
frame:RegisterEvent("CHALLENGE_MODE_COMPLETED")
frame:RegisterEvent("MYTHIC_PLUS_NEW_WEEKLY_RECORD")

frame:SetScript("OnEvent", function(_, event)
    scheduleRecapture(
        string.lower(string.gsub(event, "_", "-")),
        event == "PLAYER_ENTERING_WORLD" and 1 or 0.5
    )
end)
