local _, private = ...

--[[
    Season-configurable quest evidence for Weeklies tracker signals.
    Update questIds here when Blizzard rotates weekly objectives.
]]
private.WeekliesSignalsCatalog = {
    troveHuntersBountyUsed = {
        -- Community macro evidence for weekly Trovehunter's Bounty state.
        questIds = { 86371 }
    },
    metaQuest = {
        -- Purging the Vaults (Vaults of Atal'Utek weekly).
        questIds = { 95520 }
    }
}
