local _, private = ...
local API = private.API

--[[
    Gear Capture V1 - a full current-equipment snapshot of the 16
    standard equipment slots. Tier and embellishment detection are
    explicitly out of scope (no reliable current API was confirmed for
    either) - this module never reports them.

    UNKNOWN > WRONG: a slot with equipped = false is confirmed-empty
    evidence. A slot with equipped = true always carries itemId and
    itemLink (both come from synchronous, cache-independent APIs), but
    itemLevel/quality/socketCount may legitimately be nil if the WoW
    item cache had not resolved that item yet at capture time - nil
    here always means "not known yet", never "zero"/"none". The item
    stays in the snapshot regardless; only the enrichment fields are
    missing, and a later capture (see the item-load and
    PLAYER_EQUIPMENT_CHANGED handling below) fills them in once ready.
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
    C_Item.GetItemNumSockets's existence as the "total sockets on this
    item" API could not be independently confirmed against current
    documentation at the time this was written. It is called through
    pcall specifically so that if the name is wrong or unavailable, the
    result is socketCount = nil (unknown) rather than a Lua error that
    would abort the whole capture.
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

local function captureGear()
    local slots = {}

    for _, definition in ipairs(
        slotDefinitions
    ) do
        slots[definition.key] =
            captureSlot(
                "player",
                definition.invSlot
            )
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
    Without this, a session where the player never changes gear and
    never logs out would leave Gear entirely uncaptured (Core's own
    logout-wide capture-all-modules is the only other trigger). Hooking
    the existing post-login-ready event gives Gear an initial snapshot
    every session without waiting on either of those.
]]
API.Subscribe(
    "SYNTRACK_CORE_READY",
    function()
        API.CaptureModule(
            "gear",
            "addon-loaded"
        )
    end
)

--[[
    Core's own event handling deliberately does not recapture every
    module on every gear change (that would be wasteful for
    professions). Gear owns its own trigger and debounce instead.
]]
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

--[[
    PLAYER_EQUIPMENT_CHANGED's second argument (documented elsewhere as
    "hasCurrent") has historically ambiguous/possibly-flipped meaning -
    it is intentionally never read here. Any equipment-changed event
    simply triggers a fresh, debounced re-read of the real slot state.
]]
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

--[[
    Converges an initially-partial snapshot (captured right after
    login, before the WoW item cache resolved everything) toward a
    fully-enriched one, without ever guessing in the meantime. Pending
    loads are deduplicated by itemId so a stack of items loading around
    the same moment only triggers one debounced recapture.
]]
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
