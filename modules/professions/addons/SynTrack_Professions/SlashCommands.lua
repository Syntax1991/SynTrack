local _, PT = ...

--[[
    Split out of Events.lua purely to keep that file under the
    architecture line cap - slash-command handling has always been a
    separate concern from event-driven refresh, just previously
    colocated. PT.ClearPendingProfessionRefresh/RunProfessionRefresh
    are Events.lua's own public entry points.
]]
local function trimCommand(value)
    local command =
        string.lower(
            value
            or ""
        )

    return string.match(
        command,
        "^%s*(.-)%s*$"
    )
end

local function printCaptureStatus()
    if PT.PrintCurrentProfessionCaptureStatus then
        PT.PrintCurrentProfessionCaptureStatus()
        return
    end

    PT.PrintStatus()
end

local function runBackgroundProbe()
    if not PT.RunBackgroundProfessionProbe then
        PT.Print(
            "Background-Probe ist nicht verfügbar."
        )

        return
    end

    PT.RunBackgroundProfessionProbe()
end

local function runHeadlessProbe()
    if not PT.RunHeadlessProfessionProbe then
        PT.Print(
            "Headless-Probe ist nicht verfügbar."
        )

        return
    end

    PT.RunHeadlessProfessionProbe()
end

local function handleSlashCommand(input)
    local command =
        trimCommand(
            input
        )

    if command == "" then
        PT.PrintStatus()
        return
    end

    if command == "status" then
        printCaptureStatus()
        return
    end

    if command == "probe" then
        runBackgroundProbe()
        return
    end

    if command == "headless" then
        runHeadlessProbe()
        return
    end

    if command == "sync" then
        PT.ClearPendingProfessionRefresh()

        PT.RunProfessionRefresh(
            "manual",
            "Manueller Sync",
            true
        )

        return
    end

    PT.Print(
        "Befehle: /st status, /st sync, /st probe, /st headless"
    )
end

function PT.InitializeProfessionSlashCommands()
    SLASH_PROFESSIONTRACKER1 =
        "/syntrack"

    SLASH_PROFESSIONTRACKER2 =
        "/st"

    SLASH_PROFESSIONTRACKER3 =
        "/professiontracker"

    SLASH_PROFESSIONTRACKER4 =
        "/pt"

    SlashCmdList.PROFESSIONTRACKER =
        handleSlashCommand
end
