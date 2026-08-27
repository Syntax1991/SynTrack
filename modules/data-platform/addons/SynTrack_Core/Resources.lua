local _, private = ...
local API = private.API

--[[
    Resources V1 - broadly captures the character's discovered currency
    list plus a small, explicit catalog of item-backed resources (see
    ResourceCatalog.lua). No season-specific currency ID list lives here
    - the addon captures everything discovered/owned, and the backend's
    ResourceDefinition config decides what actually gets persisted
    (see the Currency & Weekly Resource Tracking audit's filtering rule).

    UNKNOWN > WRONG: C_CurrencyInfo.GetCurrencyInfo can legitimately
    return nil for a currency the character has never discovered - such
    a currency simply never appears in the captured list at all, never
    as a fabricated zero. A field the API reports as "0 means no limit"
    (maxQuantity, maxWeeklyQuantity) is translated to nil here rather
    than uploaded as a false real cap of zero.
]]

local function getCappedFlag(currencyId, weekly)
    if not C_CurrencyInfo then
        return nil
    end

    local api = weekly
        and C_CurrencyInfo.PlayerHasMaxWeeklyQuantity
        or C_CurrencyInfo.PlayerHasMaxQuantity

    if not api then
        return nil
    end

    local succeeded, result = pcall(api, currencyId)

    if not succeeded or type(result) ~= "boolean" then
        return nil
    end

    return result
end

local function getAccountWideFlag(currencyId)
    if not C_CurrencyInfo
        or not C_CurrencyInfo.IsAccountWideCurrency
    then
        return nil
    end

    local succeeded, result = pcall(
        C_CurrencyInfo.IsAccountWideCurrency,
        currencyId
    )

    if not succeeded or type(result) ~= "boolean" then
        return nil
    end

    return result
end

local function positiveOrNil(value)
    if type(value) ~= "number" or value <= 0 then
        return nil
    end

    return value
end

local function captureCurrency(currencyId)
    if not C_CurrencyInfo
        or not C_CurrencyInfo.GetCurrencyInfo
    then
        return nil
    end

    local succeeded, info = pcall(
        C_CurrencyInfo.GetCurrencyInfo,
        currencyId
    )

    if not succeeded or type(info) ~= "table" then
        return nil
    end

    local hasWeeklyTracking = info.canEarnPerWeek == true

    return {
        currencyId = currencyId,
        quantity = info.quantity,
        maxQuantity = positiveOrNil(info.maxQuantity),

        weeklyQuantity = hasWeeklyTracking
            and info.quantityEarnedThisWeek
            or nil,

        maxWeeklyQuantity = hasWeeklyTracking
            and positiveOrNil(info.maxWeeklyQuantity)
            or nil,

        isCapped = getCappedFlag(currencyId, false),
        isWeeklyCapped = getCappedFlag(currencyId, true),
        discovered = info.discovered,
        accountWide = getAccountWideFlag(currencyId)
    }
end

--[[
    Enumerates every currency the character has ever discovered, via the
    same list Blizzard's own currency tab reads from - no addon-side
    hardcoded currency-ID list, so a season's new currencies need no
    addon code change (only a backend ResourceDefinition seed change).
    Header rows (currency-tab section dividers) are skipped.
]]
local function captureCurrencies()
    local currencies = {}

    if not C_CurrencyInfo
        or not C_CurrencyInfo.GetCurrencyListSize
        or not C_CurrencyInfo.GetCurrencyListInfo
    then
        return currencies
    end

    local succeededSize, size = pcall(
        C_CurrencyInfo.GetCurrencyListSize
    )

    if not succeededSize or type(size) ~= "number" then
        return currencies
    end

    for index = 1, size do
        local succeededInfo, listInfo = pcall(
            C_CurrencyInfo.GetCurrencyListInfo,
            index
        )

        if succeededInfo
            and type(listInfo) == "table"
            and not listInfo.isHeader
            and type(listInfo.currencyID) == "number"
            and listInfo.currencyID > 0
        then
            local entry = captureCurrency(
                listInfo.currencyID
            )

            if entry then
                table.insert(currencies, entry)
            end
        end
    end

    return currencies
end

--[[
    Item-backed resources (e.g. Spark of Tides) cannot be enumerated -
    the addon must know which item IDs to count, via the small
    declarative catalog in ResourceCatalog.lua. A missing/failed count
    stays nil (UNKNOWN), never a fabricated 0.
]]
local function captureItems()
    local items = {}

    if not C_Item or not C_Item.GetItemCount then
        return items
    end

    for _, definition in ipairs(
        private.ResourceCatalog.trackedItems
    ) do
        local succeeded, count = pcall(
            C_Item.GetItemCount,
            definition.itemId,
            true,  -- includeBank
            false, -- includeUses (charge-based items, not relevant here)
            true,  -- includeReagentBank
            true   -- includeAccountBank (Warband bank)
        )

        table.insert(items, {
            key = definition.key,
            itemId = definition.itemId,

            count = (succeeded and type(count) == "number")
                and count
                or nil
        })
    end

    return items
end

local function captureResources()
    return {
        currencies = captureCurrencies(),
        items = captureItems()
    }
end

local function registerResourcesModule()
    local succeeded, errorMessage =
        API.RegisterModule({
            id = "resources",
            name = "Resources",
            version = "0.1.0",
            schemaVersion = 1,
            scope = "character",
            capture = captureResources
        })

    if not succeeded then
        API.Print(
            "Resources registration failed: "
                .. tostring(errorMessage)
        )
    end
end

registerResourcesModule()

--[[
    Without this, a session with no currency/item change and no logout
    would leave Resources entirely uncaptured. Mirrors Gear's own
    SYNTRACK_CORE_READY hook.
]]
API.Subscribe(
    "SYNTRACK_CORE_READY",
    function()
        API.CaptureModule(
            "resources",
            "addon-loaded"
        )
    end
)

--[[
    Resources owns its own trigger/debounce, exactly like Gear - a
    currency or bag change never recaptures Gear/Professions, and vice
    versa. Both currency changes and item-count changes recapture the
    same combined snapshot (currencies + items together), since either
    one only needs a single debounced re-read of both.
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
                "resources",
                reason
            )
        end
    )
end

--[[
    CURRENCY_DISPLAY_UPDATE covers standard currencies. BAG_UPDATE_DELAYED
    is the smallest reliable event for item-count changes (fires once
    after a batch of bag changes settle, unlike the noisy per-slot
    BAG_UPDATE) - see the Currency & Weekly Resource Tracking audit.
]]
local resourceFrame = CreateFrame("Frame")

resourceFrame:RegisterEvent(
    "CURRENCY_DISPLAY_UPDATE"
)

resourceFrame:RegisterEvent(
    "BAG_UPDATE_DELAYED"
)

resourceFrame:SetScript(
    "OnEvent",
    function(_, event)
        scheduleRecapture(
            event == "CURRENCY_DISPLAY_UPDATE"
                and "currency-changed"
                or "bag-changed"
        )
    end
)
