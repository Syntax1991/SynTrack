--[[
    Gear Capture - full current-equipment snapshot of the 16 standard
    slots. Schema v2 adds raw set/uniqueness evidence for backend Tier
    Set + Embellishment derivation (never classified here).

    UNKNOWN > WRONG: equipped = false is confirmed-empty evidence.
    equipped = true always carries itemId/itemLink; enrichment fields
    may be nil while the item cache is unresolved - nil means unknown,
    never zero.
]]

local _, private = ...
local API = private.API
local GearEvidence = private.GearEvidence

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

local function getSocketCount(itemLink)
    if not itemLink or not C_Item
        or not C_Item.GetItemNumSockets
    then
        return nil
    end

    local succeeded, socketCount =
        pcall(C_Item.GetItemNumSockets, itemLink)

    if not succeeded or type(socketCount) ~= "number" then
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
        C_Item.GetDetailedItemLevelInfo(itemLink)

    if type(actualItemLevel) ~= "number" or actualItemLevel <= 0 then
        return nil
    end

    return actualItemLevel
end

local function captureSlot(unit, invSlot)
    local itemId = GetInventoryItemID(unit, invSlot)

    if not itemId then
        return { equipped = false }
    end

    local itemLink = GetInventoryItemLink(unit, invSlot)
    local slot = {
        equipped = true,
        itemId = itemId,
        itemLink = itemLink,
        itemLevel = getActualItemLevel(itemLink),
        quality = nil,
        socketCount = getSocketCount(itemLink)
    }

    return GearEvidence.enrichEquippedSlot(slot)
end

--[[
    All 16 slots unequipped is far more likely to mean equipment data
    hasn't synced yet than a genuinely naked max-level character.
    nil tells ModuleRegistry to leave prior good data untouched.
]]
local function captureGear()
    local slots = {}
    local anySlotResolved = false

    for _, definition in ipairs(slotDefinitions) do
        local slot = captureSlot("player", definition.invSlot)

        if slot.equipped then
            anySlotResolved = true
        end

        slots[definition.key] = slot
    end

    if not anySlotResolved then
        return nil
    end

    return {
        slots = slots,
        currentExpansionId = GearEvidence.getCurrentExpansionId()
    }
end

local function registerGearModule()
    local succeeded, errorMessage = API.RegisterModule({
        id = "gear",
        name = "Gear",
        version = "0.2.0",
        schemaVersion = 2,
        scope = "character",
        capture = captureGear
    })

    if not succeeded then
        API.Print(
            "Gear registration failed: " .. tostring(errorMessage)
        )
    end
end

registerGearModule()

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

entryFrame:RegisterEvent("PLAYER_ENTERING_WORLD")

entryFrame:SetScript("OnEvent", function()
    if hasCapturedInitialGear then
        return
    end

    hasCapturedInitialGear = true
    entryFrame:UnregisterEvent("PLAYER_ENTERING_WORLD")
    attemptInitialGearCapture(1)
end)

local recaptureTimer = nil

local function scheduleRecapture(reason)
    if recaptureTimer then
        recaptureTimer:Cancel()
    end

    recaptureTimer = C_Timer.NewTimer(0.5, function()
        recaptureTimer = nil
        API.CaptureModule("gear", reason)
    end)
end

local equipmentFrame = CreateFrame("Frame")

equipmentFrame:RegisterEvent("PLAYER_EQUIPMENT_CHANGED")

equipmentFrame:SetScript("OnEvent", function()
    scheduleRecapture("equipment-changed")
end)

local pendingItemLoads = {}

local function scheduleEnrichmentRecapture(itemId)
    if pendingItemLoads[itemId] then
        return
    end

    pendingItemLoads[itemId] = true

    local item = Item:CreateFromItemID(itemId)

    item:ContinueOnItemLoad(function()
        pendingItemLoads[itemId] = nil
        scheduleRecapture("item-info-ready")
    end)
end

local function queueEnrichmentForIncompleteSlots()
    for _, definition in ipairs(slotDefinitions) do
        local itemId = GetInventoryItemID("player", definition.invSlot)

        if itemId and not C_Item.IsItemDataCachedByID(itemId) then
            scheduleEnrichmentRecapture(itemId)
        end
    end
end

API.Subscribe("SYNTRACK_MODULE_CAPTURED", function(moduleId)
    if moduleId == "gear" then
        queueEnrichmentForIncompleteSlots()
    end
end)
