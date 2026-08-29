local addonName, PT = ...

local eventFrame =
    CreateFrame("Frame")

local pendingTimer = nil
local pendingReason = nil
local pendingAnnounce = false

local hasAnnouncedInitialSync =
    false

local automaticRefreshEvents = {
    PLAYER_LEVEL_UP = {
        reason = "level-up",
        delay = 0.5,
        announce = false
    },

    SKILL_LINES_CHANGED = {
        reason = "skill-lines-changed",
        delay = 1.5,
        announce = false
    },

    TRADE_SKILL_SHOW = {
        reason = "trade-skill-show",
        delay = 0.15,
        announce = false
    },

    TRADE_SKILL_LIST_UPDATE = {
        reason = "trade-skill-list-update",
        delay = 0.25,
        announce = false
    },

    TRADE_SKILL_DATA_SOURCE_CHANGED = {
        reason = "trade-skill-data-source-changed",
        delay = 0.25,
        announce = false
    },

    TRAIT_CONFIG_UPDATED = {
        reason = "profession-trait-config-updated",
        delay = 0.15,
        announce = false
    },

    TRADE_SKILL_CLOSE = {
        reason = "trade-skill-close",
        delay = 0.25,
        announce = false
    },

    --[[
        Weekly Profession Quest turn-ins fire this reliably, and so do
        hidden-quest completions (Treatise use, Knowledge Drops) - a
        completed quest fires QUEST_TURNED_IN regardless of whether it
        has a visible turn-in UI. This is the single event that lets
        Profession Weekly state update live without requiring a
        /reload or loading screen. See the profession weekly
        correctness audit - QUEST_LOG_UPDATE and raw BAG_UPDATE_DELAYED
        were deliberately NOT registered here (too frequent/unrelated,
        would defeat the point of debouncing).
    ]]
    QUEST_TURNED_IN = {
        reason = "quest-turned-in",
        delay = 1,
        announce = false
    }
}

local function cancelPendingTimer()
    if pendingTimer
        and pendingTimer.Cancel
    then
        pendingTimer:Cancel()
    end

    pendingTimer = nil
end

local function clearPendingRefresh()
    cancelPendingTimer()

    pendingReason = nil
    pendingAnnounce = false
end

--[[
    Public wrapper so SlashCommands.lua can clear a pending debounced
    refresh before forcing an immediate manual sync.
]]
function PT.ClearPendingProfessionRefresh()
    clearPendingRefresh()
end

local function runScheduledRefresh()
    local reason =
        pendingReason
        or "automatic"

    local announce =
        pendingAnnounce
        == true

    pendingTimer = nil
    pendingReason = nil
    pendingAnnounce = false

    PT.RunProfessionRefresh(
        reason,
        "Auto-Sync",
        announce
    )
end

local function scheduleRefresh(
    reason,
    delay,
    announce
)
    pendingAnnounce =
        pendingAnnounce
        or announce
        == true

    pendingReason =
        reason
        or "automatic"

    cancelPendingTimer()

    if C_Timer
        and C_Timer.NewTimer
    then
        pendingTimer =
            C_Timer.NewTimer(
                delay
                or 0.25,
                runScheduledRefresh
            )

        return
    end

    runScheduledRefresh()
end

--[[
    Public wrapper so ProfessionWeeklyRefreshEvents.lua can trigger the
    same debounced refresh pipeline without duplicating the pending-
    timer/coalescing logic above.
]]
function PT.ScheduleProfessionRefresh(
    reason,
    delay,
    announce
)
    scheduleRefresh(
        reason,
        delay,
        announce
    )
end

local function scheduleInitialSync()
    local announce =
        not hasAnnouncedInitialSync

    hasAnnouncedInitialSync =
        true

    scheduleRefresh(
        "entering-world",
        1.5,
        announce
    )
end

local function handleAddonLoaded(
    loadedAddonName
)
    if loadedAddonName ~= addonName then
        return
    end

    PT.EnsureDatabase()
    PT.InitializeProfessionSlashCommands()
end

local function headlessProbeActive()
    return PT.IsHeadlessProfessionProbeActive
        and PT.IsHeadlessProfessionProbeActive()
end

local function handleAutomaticRefresh(event)
    if headlessProbeActive() then
        return
    end

    local configuration =
        automaticRefreshEvents[
            event
        ]

    if not configuration then
        return
    end

    scheduleRefresh(
        configuration.reason,
        configuration.delay,
        configuration.announce
    )
end

local function handleLogout()
    clearPendingRefresh()

    PT.RunProfessionRefresh(
        "logout",
        "Auto-Sync",
        false
    )
end

local function handleEvent(
    _,
    event,
    argument,
    _,
    spellId
)
    if event == "ADDON_LOADED" then
        handleAddonLoaded(
            argument
        )

        return
    end

    if event == "PLAYER_ENTERING_WORLD" then
        scheduleInitialSync()
        return
    end

    if event == "PLAYER_LOGOUT" then
        handleLogout()
        return
    end

    if event == "UNIT_SPELLCAST_SUCCEEDED" then
        if not headlessProbeActive() then
            PT.HandleTreatiseSpellcastSucceeded(
                argument,
                spellId
            )
        end

        return
    end

    handleAutomaticRefresh(
        event
    )
end

eventFrame:RegisterEvent(
    "ADDON_LOADED"
)

eventFrame:RegisterEvent(
    "PLAYER_ENTERING_WORLD"
)

eventFrame:RegisterEvent(
    "PLAYER_LOGOUT"
)

eventFrame:RegisterEvent(
    "UNIT_SPELLCAST_SUCCEEDED"
)

for event in pairs(
    automaticRefreshEvents
) do
    eventFrame:RegisterEvent(
        event
    )
end

eventFrame:SetScript(
    "OnEvent",
    handleEvent
)