local _, private = ...
local API = private.API

local registry = {}

local function validModuleId(moduleId)
    return type(moduleId) == "string"
        and string.match(
            moduleId,
            "^[a-z0-9][a-z0-9%-]*$"
        ) ~= nil
end

local function storeModuleMetadata(
    definition
)
    local database =
        API.EnsureDatabase()

    database.modules[
        definition.id
    ] = {
        id = definition.id,
        name =
            definition.name
            or definition.id,
        version =
            definition.version
            or "0.0.0",
        schemaVersion =
            definition.schemaVersion
            or 1,
        scope =
            definition.scope
            or "character",
        registeredAt =
            private.Now()
    }
end

function API.RegisterModule(definition)
    if type(definition) ~= "table"
        or not validModuleId(
            definition.id
        )
    then
        return false,
            "module id must use lowercase letters, numbers or hyphens"
    end

    if definition.capture ~= nil
        and type(definition.capture) ~= "function"
    then
        return false,
            "module capture must be a function"
    end

    if definition.scope ~= nil
        and definition.scope ~= "character"
        and definition.scope ~= "account"
    then
        return false,
            "module scope must be character or account"
    end

    registry[
        definition.id
    ] = definition

    storeModuleMetadata(
        definition
    )

    API.Publish(
        "SYNTRACK_MODULE_REGISTERED",
        definition.id
    )

    return true
end

function API.GetModule(moduleId)
    return registry[moduleId]
end

function API.GetRegisteredModules()
    local modules = {}

    for moduleId, definition in pairs(
        registry
    ) do
        modules[moduleId] = definition
    end

    return modules
end

local function captureTarget(
    definition,
    character
)
    local database =
        API.EnsureDatabase()

    if definition.scope == "account" then
        return database.accountModules
    end

    if not character then
        return nil
    end

    character.modules =
        character.modules
        or {}

    return character.modules
end

function API.CaptureModule(
    moduleId,
    reason
)
    local definition =
        registry[moduleId]

    if not definition then
        return false,
            "module is not registered"
    end

    local character =
        API.CaptureCurrentCharacter(
            reason
            or "module-capture"
        )

    local target =
        captureTarget(
            definition,
            character
        )

    if not target then
        return false,
            "current character is not available"
    end

    local capturedAt =
        private.Now()

    local payload = {}

    if definition.capture then
        local succeeded,
            captureResult =
            pcall(
                definition.capture,
                {
                    reason = reason,
                    capturedAt = capturedAt,
                    character = character,
                    database = API.GetDatabase()
                }
            )

        if not succeeded then
            return false,
                tostring(captureResult)
        end

        --[[
            A module's capture function returning nil is a deliberate
            abstention (e.g. Gear declining to report when equipment
            data hasn't synced yet), not "capture an empty snapshot".
            Leaving the previously-stored module entry untouched here
            is what makes that abstention actually protect prior data
            during a CaptureAllModules sweep (e.g. on PLAYER_LOGOUT) -
            defaulting to {} would silently overwrite known-good data
            with a false empty one. UNKNOWN > WRONG.
        ]]
        if captureResult == nil then
            return false,
                "module declined to capture"
        end

        payload = captureResult
    end

    target[moduleId] = {
        version =
            definition.version
            or "0.0.0",
        schemaVersion =
            definition.schemaVersion
            or 1,
        capturedAt = capturedAt,
        reason =
            reason
            or "unknown",
        data = payload
    }

    private.TouchDatabase(
        reason
        or "module-capture"
    )

    API.Publish(
        "SYNTRACK_MODULE_CAPTURED",
        moduleId
    )

    return true,
        target[moduleId]
end

function API.CaptureAllModules(reason)
    local captured = 0
    local failures = {}

    for moduleId in pairs(
        registry
    ) do
        local succeeded,
            errorMessage =
            API.CaptureModule(
                moduleId,
                reason
            )

        if succeeded then
            captured = captured + 1
        else
            failures[moduleId] =
                errorMessage
        end
    end

    return captured,
        failures
end
