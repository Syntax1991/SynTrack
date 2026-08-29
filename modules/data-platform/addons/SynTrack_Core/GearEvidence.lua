--[[
    Gear set / uniqueness evidence helpers for Tier Set and Embellishment
    derivation. Raw facts only - never "isTier" / "isEmbellished" booleans.
    UNKNOWN > WRONG: unresolved item cache returns resolved=false, not zero.
]]

local _, private = ...

local GearEvidence = {}

function GearEvidence.getItemInfoFields(itemLink)
    if not itemLink or not C_Item or not C_Item.GetItemInfo then
        return {
            quality = nil,
            expansionId = nil,
            setId = nil,
            equipLoc = nil,
            itemInfoResolved = false
        }
    end

    local itemName, _, quality, _, _, _, _, _, equipLoc, _, _, _, _, _, expansionId, setId =
        C_Item.GetItemInfo(itemLink)

    if type(itemName) ~= "string" then
        return {
            quality = nil,
            expansionId = nil,
            setId = nil,
            equipLoc = nil,
            itemInfoResolved = false
        }
    end

    return {
        quality = type(quality) == "number" and quality or nil,
        expansionId = type(expansionId) == "number" and expansionId or nil,
        setId = type(setId) == "number" and setId or nil,
        equipLoc = type(equipLoc) == "string" and equipLoc or nil,
        itemInfoResolved = true
    }
end

--[[
    Scan bags for items that have a setId. Backend filters to the active
    Midnight Season 2 allowlist - the addon only reports raw set facts.
]]
function GearEvidence.captureBagSetPieces()
    if not C_Container or not C_Container.GetContainerNumSlots
        or not C_Container.GetContainerItemLink
    then
        return {}
    end

    local pieces = {}
    local firstBag = BACKPACK_CONTAINER or 0
    local lastBag = NUM_BAG_SLOTS or 4

    for bag = firstBag, lastBag do
        local numSlots = C_Container.GetContainerNumSlots(bag)

        if type(numSlots) == "number" then
            for slot = 1, numSlots do
                local itemLink =
                    C_Container.GetContainerItemLink(bag, slot)

                if itemLink then
                    local info = GearEvidence.getItemInfoFields(itemLink)

                    if info.itemInfoResolved and type(info.setId) == "number" then
                        local itemId =
                            C_Item.GetItemIDForItemInfo
                                and C_Item.GetItemIDForItemInfo(itemLink)
                                or nil

                        if type(itemId) ~= "number" and type(GetItemInfoInstant) == "function" then
                            itemId = GetItemInfoInstant(itemLink)
                        end

                        pieces[#pieces + 1] = {
                            itemId = itemId,
                            itemLink = itemLink,
                            setId = info.setId,
                            expansionId = info.expansionId,
                            equipLoc = info.equipLoc,
                            setEvidenceResolved = true
                        }
                    end
                end
            end
        end
    end

    return pieces
end

function GearEvidence.getSetBonusSpellIds(itemId)
    if type(itemId) ~= "number"
        or not C_Item
        or not C_Item.GetSetBonusesForSpecializationByItemID
        or not GetSpecialization
        or not GetSpecializationInfo
    then
        return nil, false
    end

    local specIndex = GetSpecialization()

    if type(specIndex) ~= "number" then
        return nil, false
    end

    local specId = GetSpecializationInfo(specIndex)

    if type(specId) ~= "number" then
        return nil, false
    end

    local succeeded, spellIds = pcall(
        C_Item.GetSetBonusesForSpecializationByItemID,
        specId,
        itemId
    )

    if not succeeded then
        return nil, false
    end

    if type(spellIds) ~= "table" then
        return {}, true
    end

    local result = {}

    for _, spellId in pairs(spellIds) do
        if type(spellId) == "number" then
            result[#result + 1] = spellId
        end
    end

    return result, true
end

function GearEvidence.getUniqueness(itemLink, itemId)
    if not C_Item or not C_Item.GetItemUniquenessByID then
        return {
            uniqueCategoryId = nil,
            uniqueCategoryCount = nil,
            uniquenessResolved = false
        }
    end

    local itemInfo = itemLink or itemId

    if not itemInfo then
        return {
            uniqueCategoryId = nil,
            uniqueCategoryCount = nil,
            uniquenessResolved = false
        }
    end

    local succeeded, isUnique, _, limitCategoryCount, limitCategoryID =
        pcall(C_Item.GetItemUniquenessByID, itemInfo)

    if not succeeded then
        return {
            uniqueCategoryId = nil,
            uniqueCategoryCount = nil,
            uniquenessResolved = false
        }
    end

    if isUnique == nil and limitCategoryCount == nil and limitCategoryID == nil then
        return {
            uniqueCategoryId = nil,
            uniqueCategoryCount = nil,
            uniquenessResolved = false
        }
    end

    return {
        uniqueCategoryId = type(limitCategoryID) == "number" and limitCategoryID or nil,
        uniqueCategoryCount = type(limitCategoryCount) == "number" and limitCategoryCount or nil,
        uniquenessResolved = true
    }
end

function GearEvidence.getCurrentExpansionId()
    if type(GetExpansionLevel) == "function" then
        local expansionId = GetExpansionLevel()

        if type(expansionId) == "number" then
            return expansionId
        end
    end

    return nil
end

function GearEvidence.enrichEquippedSlot(slot)
    if not slot or not slot.equipped then
        return slot
    end

    local info = GearEvidence.getItemInfoFields(slot.itemLink)
    local setBonusSpellIds, setBonusResolved =
        GearEvidence.getSetBonusSpellIds(slot.itemId)
    local uniqueness = GearEvidence.getUniqueness(
        slot.itemLink,
        slot.itemId
    )

    slot.quality = slot.quality or info.quality
    slot.expansionId = info.expansionId
    slot.setId = info.setId
    slot.setEvidenceResolved = info.itemInfoResolved
    slot.setBonusResolved = setBonusResolved
    slot.setBonusSpellIds = setBonusSpellIds
    slot.uniqueCategoryId = uniqueness.uniqueCategoryId
    slot.uniqueCategoryCount = uniqueness.uniqueCategoryCount
    slot.uniquenessResolved = uniqueness.uniquenessResolved

    return slot
end

private.GearEvidence = GearEvidence
