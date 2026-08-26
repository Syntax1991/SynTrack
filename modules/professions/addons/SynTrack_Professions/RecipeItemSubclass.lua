local _, PT = ...

--[[
    The armor subclass is looked up by reversing Blizzard's own
    Enum.ItemArmorSubclass table at runtime rather than hardcoding a
    numeric constant here. This keeps the exported value tied to
    whatever the running client actually reports, and degrades to nil
    (never a guess) if the enum table is unavailable.
]]
function PT.ResolveArmorSubclassKey(
    classId,
    subclassId
)
    if not Enum
        or not Enum.ItemClass
        or not Enum.ItemArmorSubclass
        or classId ~=
            Enum.ItemClass.Armor
        or subclassId == nil
    then
        return nil
    end

    for key, value in pairs(
        Enum.ItemArmorSubclass
    ) do
        if value == subclassId then
            return key
        end
    end

    return nil
end

--[[
    Same reversal pattern as ResolveArmorSubclassKey above, applied to
    Enum.ItemWeaponSubclass instead of Enum.ItemArmorSubclass. Captured
    additively alongside the existing armor resolution - itemClassId/
    itemSubclassId were already being read off every recipe's output item
    for armor; this exposes the same already-fetched values for weapons
    too, still resolved only against the live client's own enum table,
    never a hardcoded numeric constant.
]]
function PT.ResolveWeaponSubclassKey(
    classId,
    subclassId
)
    if not Enum
        or not Enum.ItemClass
        or not Enum.ItemWeaponSubclass
        or classId ~=
            Enum.ItemClass.Weapon
        or subclassId == nil
    then
        return nil
    end

    for key, value in pairs(
        Enum.ItemWeaponSubclass
    ) do
        if value == subclassId then
            return key
        end
    end

    return nil
end
