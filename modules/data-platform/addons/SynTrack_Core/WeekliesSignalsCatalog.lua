local _, private = ...

--[[
    Season-configurable quest evidence for Weeklies tracker signals.

    metaQuest.questIds = LIVE CURRENT weekly Spark META alternatives.
    Completing ANY one satisfies the logical Weeklies META column.
    Keep in parity with midnight-weekly-spark-quest-catalog.ts
    (metaEligibleSparkQuestIds).
]]
private.WeekliesSignalsCatalog = {
    troveHuntersBountyUsed = {
        -- Community macro evidence for weekly Trovehunter's Bounty state.
        questIds = { 86371 }
    },
    metaQuest = {
        questIds = {
            -- Unity Against the Void parent + activity children
            93744,
            93766,
            93767,
            93769,
            93889,
            93890,
            93892,
            93909,
            93910,
            93911,
            93912,
            93913,
            95842,
            95843,
            96727,
            98232,
            -- Concurrent Season weekly Spark alternatives
            98172,
            96995,
            -- Sparks of War zone rotation
            93423,
            93424,
            93425,
            93426,
            96725,
            96726
        }
    }
}
