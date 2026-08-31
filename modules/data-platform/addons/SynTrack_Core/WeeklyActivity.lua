local _, private = ...
local API = private.API

--[[
    Weekly Activity - raw this-week facts.

    Great Vault objectives come from C_WeeklyRewards.GetActivities,
    including a per-type fetch so World (Delves) is not omitted.
    M+ run history and raid lockouts are retained as raw detail only.
]]

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
        vault = private.CaptureWeeklyVault(),
        mythicPlus = captureMythicPlus(),
        raids = captureRaids()
    }
end

local function registerWeeklyActivityModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "weekly-activity",
            name = "Weekly Activity",
            version = "0.1.1",
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

local function scheduleRecapture(reason, delaySec)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(
        delaySec or 0.5,
        function()
            recaptureTimer = nil
            API.CaptureModule("weekly-activity", reason)
        end
    )
end

local frame = CreateFrame("Frame")

frame:RegisterEvent("PLAYER_ENTERING_WORLD")
frame:RegisterEvent("WEEKLY_REWARDS_UPDATE")
frame:RegisterEvent("CHALLENGE_MODE_COMPLETED")
frame:RegisterEvent("ENCOUNTER_END")
frame:RegisterEvent("UPDATE_INSTANCE_INFO")

frame:SetScript("OnEvent", function(_, event)
    if event == "PLAYER_ENTERING_WORLD" then
        if type(RequestRaidInfo) == "function" then
            pcall(RequestRaidInfo)
        end

        scheduleRecapture("player-entering-world", 2)
        return
    end

    scheduleRecapture(
        string.lower(string.gsub(event, "_", "-")),
        0.5
    )
end)
