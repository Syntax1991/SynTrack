local _, PT = ...

--[[
    Real-time refresh support for Profession Weekly - see the
    profession weekly correctness follow-up. Weekly Quest turn-ins and
    hidden-quest completions (Treatise use, Knowledge Drops) fire
    QUEST_TURNED_IN, which Events.lua already routes through the
    existing debounced refresh. This file only carries the extra,
    belt-and-suspenders signal for Treatise use specifically: consuming
    a Treatise casts a known spell per profession (verified against
    Myu's Knowledge Points Tracker, an actively-maintained addon
    tracking the same Midnight profession weeklies).
]]
local treatiseSpellIds = {
    [1282284] = true, -- Alchemy
    [1282300] = true, -- Blacksmithing
    [1282301] = true, -- Enchanting
    [1282302] = true, -- Engineering
    [1282303] = true, -- Herbalism
    [1282304] = true, -- Inscription
    [1282305] = true, -- Jewelcrafting
    [1282306] = true, -- Leatherworking
    [1282307] = true, -- Mining
    [1282308] = true, -- Skinning
    [1282309] = true -- Tailoring
}

local function isTreatiseSpellId(spellId)
    return treatiseSpellIds[
        spellId
    ]
        == true
end

--[[
    Called from Events.lua's UNIT_SPELLCAST_SUCCEEDED handler (already
    filtered to when the headless probe is inactive). Routes through
    the same debounced refresh pipeline as every other automatic
    trigger - see PT.ScheduleProfessionRefresh in Events.lua.
]]
function PT.HandleTreatiseSpellcastSucceeded(
    unit,
    spellId
)
    if unit ~= "player" then
        return
    end

    if not isTreatiseSpellId(
        spellId
    ) then
        return
    end

    PT.ScheduleProfessionRefresh(
        "treatise-used",
        1,
        false
    )
end
