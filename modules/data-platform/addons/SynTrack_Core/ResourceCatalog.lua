local _, private = ...

--[[
    Declarative catalog of explicitly-queried tracked resources - both
    item-backed resources (which can never be enumerated, only counted
    by known itemId) and specific currencies that must be captured even
    when the character has never discovered/earned any yet.
    Resources.lua's broad currency-list enumeration (GetCurrencyListInfo)
    only ever includes currencies the client currently considers
    "known" - an undiscovered currency (quantity would read as 0) is
    absent from that list entirely, which silently produced a missing
    resource row (read as NOT_TRACKED) instead of a known zero. See the
    Resource correctness follow-up. This file is DATA, not business
    logic: a future season's new tracked resource is added here, never
    by changing capture logic elsewhere. The backend remains the final
    authority on which of these are actually tracked
    (ResourceDefinition.externalItemId/externalCurrencyId) - this
    catalog only controls what the addon *attempts* to read; an
    unmatched entry is simply ignored on the backend side.
]]
private.ResourceCatalog = {
    trackedItems = {
        { key = "spark-of-tides", itemId = 274476 }
    },

    trackedCurrencies = {
        { key = "tidal-spark-dust", currencyId = 3509 },
        { key = "venomblight-manaflux", currencyId = 3465 }
    }
}
