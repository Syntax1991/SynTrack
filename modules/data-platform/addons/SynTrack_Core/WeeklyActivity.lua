local _, private = ...
local API = private.API

--[[
    Weekly Activity V1 - raw this-week facts only.
    UNKNOWN > WRONG: a failed API lookup is omitted (never a fabricated
    zero). A successful empty result (0 M+ runs, no raid lockout) is
    captured as captured=true with empty lists.
]]

local function pcallResult(api, ...)
    if type(api) ~= "function" then
        return nil
    end

    local succeeded, result = pcall(api, ...)

    if not succeeded then
        return nil
    end

    return result
end

local function vaultTypeName(typeId)
    local enum = Enum
        and Enum.WeeklyRewardChestThresholdType

    if type(enum) ~= "table" or type(typeId) ~= "number" then
        return nil
    end

    for name, value in pairs(enum) do
        if value == typeId then
            return name
        end
    end

    return nil
end

local function captureVault()
    if not C_WeeklyRewards then
        return { captured = false }
    end

    local generated =
        pcallResult(C_WeeklyRewards.HasGeneratedRewards)
    local currentPeriod =
        pcallResult(C_WeeklyRewards.AreRewardsForCurrentRewardPeriod)
    local canClaim =
        pcallResult(C_WeeklyRewards.CanClaimRewards)
    local hasAvailable =
        pcallResult(C_WeeklyRewards.HasAvailableRewards)
    local list =
        pcallResult(C_WeeklyRewards.GetActivities)

    if type(generated) ~= "boolean"
        and type(currentPeriod) ~= "boolean"
        and type(list) ~= "table"
    then
        return { captured = false }
    end

    local activities = {}

    if type(list) == "table" then
        for _, activity in ipairs(list) do
            if type(activity) == "table"
                and type(activity.type) == "number"
            then
                table.insert(activities, {
                    type = activity.type,
                    typeName = vaultTypeName(activity.type),
                    index = activity.index,
                    threshold = activity.threshold,
                    progress = activity.progress,
                    id = activity.id,
                    level = activity.level,
                    activityTierID = activity.activityTierID,
                    claimID = activity.claimID
                })
            end
        end
    end

    return {
        captured = true,
        generated = generated,
        currentPeriod = currentPeriod,
        canClaim = canClaim,
        hasAvailable = hasAvailable,
        activities = activities
    }
end

local function captureMythicPlus()
    if not C_MythicPlus or not C_MythicPlus.GetRunHistory then
        return { captured = false }
    end

    local succeeded, history = pcall(
        C_MythicPlus.GetRunHistory,
        true,
        true
    )

    if not succeeded or type(history) ~= "table" then
        succeeded, history = pcall(C_MythicPlus.GetRunHistory, true)
    end

    if not succeeded or type(history) ~= "table" then
        return { captured = false }
    end

    local runs = {}

    for _, run in ipairs(history) do
        if type(run) == "table" and type(run.level) == "number" then
            table.insert(runs, {
                mapChallengeModeId =
                    run.mapChallengeModeID or run.mapChallengeModeId,
                level = run.level,
                completed = run.completed,
                thisWeek = run.thisWeek,
                durationSec = run.durationSec,
                dungeonScore = run.dungeonScore
            })
        end
    end

    return {
        captured = true,
        runs = runs
    }
end

local function captureRaids()
    if type(GetNumSavedInstances) ~= "function"
        or type(GetSavedInstanceInfo) ~= "function"
    then
        return { captured = false }
    end

    local succeeded, count = pcall(GetNumSavedInstances)

    if not succeeded or type(count) ~= "number" then
        return { captured = false }
    end

    local raids = {}

    for index = 1, count do
        local ok, name, _, reset, difficulty, _, _, _, isRaid, _,
            difficultyName, numEncounters, encounterProgress =
            pcall(GetSavedInstanceInfo, index)

        if ok
            and isRaid == true
            and type(reset) == "number"
            and reset > 0
            and type(name) == "string"
        then
            local encounters = {}
            local encounterCount =
                type(numEncounters) == "number" and numEncounters or 0

            for encounterIndex = 1, encounterCount do
                if type(GetSavedInstanceEncounterInfo) == "function" then
                    local encounterOk, bossName, _, isKilled = pcall(
                        GetSavedInstanceEncounterInfo,
                        index,
                        encounterIndex
                    )

                    if encounterOk then
                        table.insert(encounters, {
                            index = encounterIndex,
                            name = bossName,
                            isKilled = isKilled
                        })
                    end
                end
            end

            table.insert(raids, {
                name = name,
                difficulty = difficulty,
                difficultyName = difficultyName,
                encounterProgress = encounterProgress,
                numEncounters = numEncounters,
                encounters = encounters
            })
        end
    end

    return {
        captured = true,
        raids = raids
    }
end

local function captureWeeklyActivity()
    return {
        vault = captureVault(),
        mythicPlus = captureMythicPlus(),
        raids = captureRaids()
    }
end

local function registerWeeklyActivityModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "weekly-activity",
            name = "Weekly Activity",
            version = "0.1.0",
            schemaVersion = 1,
            scope = "character",
            capture = captureWeeklyActivity
        })

    if not succeeded then
        API.Print(
            "Weekly Activity registration failed: "
                .. tostring(errorMessage)
        )
    end
end

registerWeeklyActivityModule()

API.Subscribe(
    "SYNTRACK_CORE_READY",
    function()
        if type(RequestRaidInfo) == "function" then
            pcall(RequestRaidInfo)
        end

        API.CaptureModule(
            "weekly-activity",
            "addon-loaded"
        )
    end
)

local recaptureTimer = nil

local function scheduleRecapture(reason)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(
        0.5,
        function()
            recaptureTimer = nil
            API.CaptureModule("weekly-activity", reason)
        end
    )
end

local frame = CreateFrame("Frame")

frame:RegisterEvent("WEEKLY_REWARDS_UPDATE")
frame:RegisterEvent("CHALLENGE_MODE_COMPLETED")
frame:RegisterEvent("UPDATE_INSTANCE_INFO")

frame:SetScript("OnEvent", function(_, event)
    scheduleRecapture(
        string.lower(string.gsub(event, "_", "-"))
    )
end)
