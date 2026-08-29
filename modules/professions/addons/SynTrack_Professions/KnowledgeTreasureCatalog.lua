local _, PT = ...

--[[
    Permanent, once-per-character-per-profession Knowledge Treasure
    quest flags - fully separate from ProfessionWeeklyCatalog.lua's
    Weekly Quest/Treatise/Knowledge Drops (all of which reset weekly).
    These never reset. See the profession weekly correctness follow-
    up's Knowledge Treasures addition.

    Each profession has 8 independent world-collectible treasures
    (unlike ProfessionWeeklyCatalog's "any one of N candidates per
    slot", each treasure here is its own single quest id - no
    alternation). Cross-verified 2026-08-29 against Myu's Knowledge
    Points Tracker and DennisRas/WeeklyKnowledge - both independently
    maintained addons agree exactly on all 88 ids, zero conflicts.

    UNKNOWN > WRONG: this file only ever adds candidates to check. It
    never decides what a user sees - that gate lives entirely on the
    backend.
]]
PT.KnowledgeTreasureCatalog = {
    alchemy = {
        89111, 89112, 89113, 89114, 89115, 89116, 89117, 89118
    },
    blacksmithing = {
        89177, 89178, 89179, 89180, 89181, 89182, 89183, 89184
    },
    enchanting = {
        89100, 89101, 89102, 89103, 89104, 89105, 89106, 89107
    },
    engineering = {
        89133, 89134, 89135, 89136, 89137, 89138, 89139, 89140
    },
    herbalism = {
        89155, 89156, 89157, 89158, 89159, 89160, 89161, 89162
    },
    inscription = {
        89067, 89068, 89069, 89070, 89071, 89072, 89073, 89074
    },
    jewelcrafting = {
        89122, 89123, 89124, 89125, 89126, 89127, 89128, 89129
    },
    leatherworking = {
        89089, 89090, 89091, 89092, 89093, 89094, 89095, 89096
    },
    mining = {
        89144, 89145, 89146, 89147, 89148, 89149, 89150, 89151
    },
    skinning = {
        89166, 89167, 89168, 89169, 89170, 89171, 89172, 89173
    },
    tailoring = {
        89078, 89079, 89080, 89081, 89082, 89083, 89084, 89085
    }
}
