local _, private = ...

--[[
    Declarative catalog of item-backed tracked resources - resources
    that cannot be enumerated the way standard currencies can (see
    Resources.lua's currency-list enumeration). This file is DATA, not
    business logic: a future season's new item-backed resource is added
    here, never by changing capture logic elsewhere. The backend remains
    the final authority on which of these are actually tracked
    (ResourceDefinition.externalItemId) - this catalog only controls
    what the addon *attempts* to read; an unmatched entry is simply
    ignored on the backend side.
]]
private.ResourceCatalog = {
    trackedItems = {
        { key = "spark-of-tides", itemId = 274476 }
    }
}
