local _, private = ...
local API = private.API
local CATALOG = private.SeasonEvidenceCatalog

--[[
    Capture raw achievement facts only.
    Backend catalog scope decides which fact applies:
      CHARACTER -> earnedByCharacter
      WARBAND   -> accountCompleted
]]

--[[
    Preserve successful boolean false.
    Never use `cond and value or nil` for booleans: when value is false,
    Lua evaluates `false or nil` → nil and drops authoritative incompleteness.
]]
local function booleanOrNil(value)
    if type(value) == "boolean" then
        return value
    end

    return nil
end

local function captureAchievement(achievementId)
    if type(GetAchievementInfo) ~= "function" then
        return nil, nil
    end

    local result = { pcall(GetAchievementInfo, achievementId) }

    if not result[1] then
        return nil, nil
    end

    -- pcall ok + GetAchievementInfo returns:
    -- id, name, points, completed, month, day, year, description, flags,
    -- icon, rewardText, isGuild, wasEarnedByMe, earnedBy, isStatistic
    local accountCompleted = booleanOrNil(result[5])
    local earnedByCharacter = booleanOrNil(result[14])

    return accountCompleted, earnedByCharacter
end

local function captureQuest(questId)
    if not C_QuestLog
        or not C_QuestLog.IsQuestFlaggedCompleted
    then
        return nil
    end

    local succeeded, flagged = pcall(
        C_QuestLog.IsQuestFlaggedCompleted,
        questId
    )

    if succeeded and type(flagged) == "boolean" then
        return flagged
    end

    return nil
end

local function captureSeasonEvidence()
    local achievements = {}
    local quests = {}

    for trackerKey, achievementId in pairs(CATALOG.achievements) do
        local accountCompleted, earnedByCharacter =
            captureAchievement(achievementId)

        achievements[trackerKey] = {
            achievementId = achievementId,
            accountCompleted = accountCompleted,
            earnedByCharacter = earnedByCharacter
        }
    end

    for trackerKey, questId in pairs(CATALOG.quests) do
        quests[trackerKey] = {
            questId = questId,
            flaggedCompleted = captureQuest(questId)
        }
    end

    return {
        achievements = achievements,
        quests = quests
    }
end

local succeeded, errorMessage = API.RegisterModule({
    id = "season-evidence",
    name = "Season Evidence",
    version = "0.2.1",
    schemaVersion = 2,
    scope = "character",
    capture = captureSeasonEvidence
})

if not succeeded then
    API.Print(
        "Season Evidence registration failed: "
            .. tostring(errorMessage)
    )
end

local recaptureTimer = nil

local function scheduleRecapture(reason, delaySec)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(
        delaySec or 0.5,
        function()
            recaptureTimer = nil
            API.CaptureModule("season-evidence", reason)
        end
    )
end

API.Subscribe("SYNTRACK_CORE_READY", function()
    API.CaptureModule("season-evidence", "addon-loaded")
end)

local frame = CreateFrame("Frame")
frame:RegisterEvent("PLAYER_ENTERING_WORLD")
frame:RegisterEvent("ACHIEVEMENT_EARNED")
frame:RegisterEvent("QUEST_TURNED_IN")
frame:SetScript("OnEvent", function(_, event)
    scheduleRecapture(
        string.lower(string.gsub(event, "_", "-")),
        event == "PLAYER_ENTERING_WORLD" and 1 or 0.5
    )
end)
