local addonName, private = ...
local API = private.API

local eventFrame =
    CreateFrame("Frame")

local function registerCoreModule()
    local succeeded,
        errorMessage =
        API.RegisterModule({
            id = "core",
            name = "SynTrack Core",
            version =
                API.ADDON_VERSION,
            schemaVersion =
                API.CORE_SCHEMA_VERSION,
            scope = "account",
            capture = function()
                return {
                    status = "ready"
                }
            end
        })

    if not succeeded then
        API.Print(
            "Core registration failed: "
                .. tostring(errorMessage)
        )
    end
end

local function handleAddonLoaded(
    loadedAddonName
)
    if loadedAddonName ~= addonName then
        return
    end

    API.EnsureDatabase()
    private.InitializeSlashCommands()
    registerCoreModule()
    API.CaptureCurrentCharacter(
        "addon-loaded"
    )
    API.Publish(
        "SYNTRACK_CORE_READY",
        API
    )
end

local function handleEvent(
    _,
    event,
    argument
)
    if event == "ADDON_LOADED" then
        handleAddonLoaded(
            argument
        )
        return
    end

    if event == "PLAYER_LOGOUT" then
        API.RefreshExport(
            "logout"
        )
        return
    end

    if event == "PLAYER_ENTERING_WORLD" then
        C_Timer.After(
            3,
            function()
                API.RefreshExport(
                    "player-entering-world"
                )
            end
        )
        return
    end

    API.CaptureCurrentCharacter(
        string.lower(
            string.gsub(
                event,
                "_",
                "-"
            )
        )
    )
end

eventFrame:RegisterEvent(
    "ADDON_LOADED"
)

eventFrame:RegisterEvent(
    "PLAYER_ENTERING_WORLD"
)

eventFrame:RegisterEvent(
    "PLAYER_LEVEL_UP"
)

eventFrame:RegisterEvent(
    "PLAYER_LOGOUT"
)

eventFrame:SetScript(
    "OnEvent",
    handleEvent
)
