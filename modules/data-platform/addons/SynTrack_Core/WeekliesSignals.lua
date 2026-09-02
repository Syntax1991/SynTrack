local _, private = ...
local API = private.API

--[[
    Weeklies tracker signals consumed by the web Weeklies matrix:
    - current-season Mythic+ rating (2K milestone)
    - Trovehunter's Bounty weekly usage flag
    - weekly Meta Quest completion
]]

local CATALOG = private.WeekliesSignalsCatalog

local function anyQuestFlagged(questIds)
    for _, questId in ipairs(questIds) do
        local succeeded, flagged =
            pcall(
                C_QuestLog.IsQuestFlaggedCompleted,
                questId
            )

        if succeeded then
            return flagged == true, questId
        end
    end

    return nil, questIds[1]
end

local function captureMythicPlusRating()
    if not C_ChallengeMode
        or not C_ChallengeMode.GetOverallDungeonScore
    then
        return { captured = false }
    end

    local succeeded, score = pcall(
        C_ChallengeMode.GetOverallDungeonScore
    )

    if not succeeded or type(score) ~= "number" then
        return { captured = false }
    end

    return {
        captured = true,
        seasonRating = math.floor(score)
    }
end

local function captureQuestSignal(signalKey, questIds)
    local flaggedCompleted, representativeQuestId =
        anyQuestFlagged(questIds)

    return {
        signalKey = signalKey,
        externalQuestId = representativeQuestId,
        flaggedCompleted = flaggedCompleted
    }
end

local function captureWeekliesSignals()
    return {
        mythicPlusRating = captureMythicPlusRating(),
        troveHuntersBountyUsed = captureQuestSignal(
            "trove-hunters-bounty-used",
            CATALOG.troveHuntersBountyUsed.questIds
        ),
        metaQuest = captureQuestSignal(
            "meta-quest",
            CATALOG.metaQuest.questIds
        )
    }
end

local function registerWeekliesSignalsModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "weeklies-signals",
            name = "Weeklies Signals",
            version = "0.1.0",
            schemaVersion = 1,
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
frame:RegisterEvent("CHALLENGE_MODE_COMPLETED")
frame:RegisterEvent("MYTHIC_PLUS_NEW_WEEKLY_RECORD")

frame:SetScript("OnEvent", function(_, event)
    scheduleRecapture(
        string.lower(string.gsub(event, "_", "-")),
        event == "PLAYER_ENTERING_WORLD" and 1 or 0.5
    )
end)
