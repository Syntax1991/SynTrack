local _, private = ...
local API = private.API

--[[
    Gear Capture V1 - a full current-equipment snapshot of the 16
    standard slots. Tier/embellishment detection is out of scope (no
    reliable API confirmed) - never reported here.

    UNKNOWN > WRONG: equipped = false is confirmed-empty evidence.
    equipped = true always carries itemId/itemLink (synchronous,
    cache-independent APIs), but itemLevel/quality/socketCount may be
    nil if the item cache hadn't resolved yet - nil means "not known
    yet", never "zero". The item stays in the snapshot; only enrichment
    fields are missing, filled in later (see item-load/
    PLAYER_EQUIPMENT_CHANGED handling below).
]]

local slotDefinitions = {
    { key = "HEAD", invSlot = INVSLOT_HEAD },
    { key = "NECK", invSlot = INVSLOT_NECK },
    { key = "SHOULDER", invSlot = INVSLOT_SHOULDER },
    { key = "BACK", invSlot = INVSLOT_BACK },
    { key = "CHEST", invSlot = INVSLOT_CHEST },
    { key = "WRIST", invSlot = INVSLOT_WRIST },
    { key = "HANDS", invSlot = INVSLOT_HAND },
    { key = "WAIST", invSlot = INVSLOT_WAIST },
    { key = "LEGS", invSlot = INVSLOT_LEGS },
    { key = "FEET", invSlot = INVSLOT_FEET },
    { key = "FINGER_1", invSlot = INVSLOT_FINGER1 },
    { key = "FINGER_2", invSlot = INVSLOT_FINGER2 },
    { key = "TRINKET_1", invSlot = INVSLOT_TRINKET1 },
    { key = "TRINKET_2", invSlot = INVSLOT_TRINKET2 },
    { key = "MAIN_HAND", invSlot = INVSLOT_MAINHAND },
    { key = "OFF_HAND", invSlot = INVSLOT_OFFHAND }
}

--[[
    C_Item.GetItemNumSockets's existence as the "total sockets" API
    couldn't be confirmed against docs when written - pcall-wrapped so
    a wrong/missing name yields nil (unknown), not a capture-aborting error.
]]
local function getSocketCount(itemLink)
    if not itemLink or not C_Item
        or not C_Item.GetItemNumSockets
    then
        return nil
    end

    local succeeded, socketCount =
        pcall(
            C_Item.GetItemNumSockets,
            itemLink
        )

    if not succeeded
        or type(socketCount) ~= "number"
    then
        return nil
    end

    return socketCount
end

local function getActualItemLevel(itemLink)
    if not itemLink or not C_Item
        or not C_Item.GetDetailedItemLevelInfo
    then
        return nil
    end

    local actualItemLevel =
        C_Item.GetDetailedItemLevelInfo(
            itemLink
        )

    if type(actualItemLevel) ~= "number"
        or actualItemLevel <= 0
    then
        return nil
    end

    return actualItemLevel
end

local function getQuality(itemLink)
    if not itemLink or not C_Item
        or not C_Item.GetItemInfo
    then
        return nil
    end

    local _, _, quality =
        C_Item.GetItemInfo(itemLink)

    if type(quality) ~= "number" then
        return nil
    end

    return quality
end

local function captureSlot(unit, invSlot)
    local itemId =
        GetInventoryItemID(
            unit,
            invSlot
        )

    if not itemId then
        return { equipped = false }
    end

    local itemLink =
        GetInventoryItemLink(
            unit,
            invSlot
        )

    return {
        equipped = true,
        itemId = itemId,
        itemLink = itemLink,
        itemLevel =
            getActualItemLevel(
                itemLink
            ),
        quality =
            getQuality(
                itemLink
            ),
        socketCount =
            getSocketCount(
                itemLink
            )
    }
end

--[[
    All 16 slots unequipped is far more likely to mean equipment data
    hasn't synced yet (see timing note below) than a genuinely naked
    max-level character. nil tells ModuleRegistry to leave prior good
    data untouched instead of wiping it. UNKNOWN > WRONG.
]]
local function captureGear()
    local slots = {}
    local anySlotResolved = false

    for _, definition in ipairs(
        slotDefinitions
    ) do
        local slot =
            captureSlot(
                "player",
                definition.invSlot
            )

        if slot.equipped then
            anySlotResolved = true
        end

        slots[definition.key] = slot
    end

    if not anySlotResolved then
        return nil
    end

    return { slots = slots }
end

local function registerGearModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "gear",
            name = "Gear",
            version = "0.1.0",
            schemaVersion = 1,
            scope = "character",
            capture = captureGear
        })

    if not succeeded then
        API.Print(
            "Gear registration failed: "
                .. tostring(errorMessage)
        )
    end
end

registerGearModule()

--[[
    Without this, a session where gear never changes and the player
    never logs out would leave Gear uncaptured. Deliberately NOT
    SYNTRACK_CORE_READY (ADDON_LOADED): unlike /reload, where equipment
    is already resolved locally, a fresh login can hit ADDON_LOADED
    before the server replicates equipped-item data, reading nil for
    every slot. PLAYER_ENTERING_WORLD is reliable on login and reload -
    but not always instant on a character not logged into in a while,
    so a bounded retry follows a bare abstention. captureGear() already
    refuses to report a false empty snapshot, so retrying only ever
    turns "no snapshot yet" into a real one, never fabricates data, and
    stops for good once a capture succeeds or the delays run out.
]]
local initialCaptureRetryDelays = { 0.5, 1, 2 }

local function attemptInitialGearCapture(retryIndex)
    local succeeded = API.CaptureModule("gear", "world-entered")

    if succeeded then
        return
    end

    local delay = initialCaptureRetryDelays[retryIndex]

    if not delay then
        return
    end

    C_Timer.NewTimer(delay, function()
        attemptInitialGearCapture(retryIndex + 1)
    end)
end

local hasCapturedInitialGear = false
local entryFrame = CreateFrame("Frame")

entryFrame:RegisterEvent(
    "PLAYER_ENTERING_WORLD"
)

entryFrame:SetScript(
    "OnEvent",
    function()
        if hasCapturedInitialGear then
            return
        end

        hasCapturedInitialGear = true

        entryFrame:UnregisterEvent(
            "PLAYER_ENTERING_WORLD"
        )

        attemptInitialGearCapture(1)
    end
)

-- Core doesn't recapture every module on every gear change (wasteful
-- for professions) - Gear owns its own trigger and debounce instead.
local recaptureTimer = nil

local function scheduleRecapture(reason)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(
        0.5,
        function()
            recaptureTimer = nil

            API.CaptureModule(
                "gear",
                reason
            )
        end
    )
end

-- PLAYER_EQUIPMENT_CHANGED's 2nd arg ("hasCurrent") is historically
-- ambiguous - intentionally never read; any event just re-reads slots.
local equipmentFrame = CreateFrame("Frame")

equipmentFrame:RegisterEvent(
    "PLAYER_EQUIPMENT_CHANGED"
)

equipmentFrame:SetScript(
    "OnEvent",
    function()
        scheduleRecapture(
            "equipment-changed"
        )
    end
)

-- Converges a partial snapshot toward fully-enriched without guessing.
-- Pending loads dedupe by itemId so a load burst triggers one recapture.
local pendingItemLoads = {}

local function scheduleEnrichmentRecapture(
    itemId
)
    if pendingItemLoads[itemId] then
        return
    end

    pendingItemLoads[itemId] = true

    local item =
        Item:CreateFromItemID(itemId)

    item:ContinueOnItemLoad(
        function()
            pendingItemLoads[itemId] =
                nil

            scheduleRecapture(
                "item-info-ready"
            )
        end
    )
end

local function queueEnrichmentForIncompleteSlots()
    for _, definition in ipairs(
        slotDefinitions
    ) do
        local itemId =
            GetInventoryItemID(
                "player",
                definition.invSlot
            )

        if itemId
            and not C_Item.IsItemDataCachedByID(
                itemId
            )
        then
            scheduleEnrichmentRecapture(
                itemId
            )
        end
    end
end

API.Subscribe(
    "SYNTRACK_MODULE_CAPTURED",
    function(moduleId)
        if moduleId == "gear" then
            queueEnrichmentForIncompleteSlots()
        end
    end
)
