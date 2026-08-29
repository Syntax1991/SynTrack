local _, PT = ...

--[[
    Candidate weekly-quest/Treatise/Knowledge Drops identities per
    profession - see the Automatic Profession Weekly audit and its
    correctness follow-up. weeklyQuest and Treatise ids were both
    cross-verified byte-for-byte 2026-08-29 against Myu's Knowledge
    Points Tracker (github.com/myu-westfall/MyusKnowledgePointsTracker,
    an actively-maintained addon tracking the same Midnight profession
    weeklies) - no discrepancies found. The addon captures raw flag
    evidence for every candidate here regardless; NONE of it reaches a
    user until the matching backend ProfessionWeeklySourceDefinition is
    explicitly enabled after live verification (enabled defaults to
    false - see the Prisma schema). Gathering professions list multiple
    quest ids (per-node/zone turn-in variants of the same weekly).

    knowledgeDrops is a list of independent "slots", each itself a list
    of candidate ids (any one flagged = that slot complete) - mirroring
    Myu's own model of separate treasure/catch-up entries rather than
    one combined currency count. Most crafting professions have two
    single-id treasure slots; Enchanting/Herbalism/Mining/Skinning
    additionally have a "gathered while working the profession" slot
    (5 alternate ids, any one) plus a separate single-id capstone slot
    unlocked after accumulating several of the first (Myu shows this as
    a distinct, higher-value entry - not part of the same alternation
    group). These ids are community-sourced and NOT yet live-verified
    against a real character, unlike weeklyQuest/treatise above.

    UNKNOWN > WRONG: this file only ever adds candidates to check. It
    never decides what a user sees - that gate lives entirely on the
    backend.
]]
PT.ProfessionWeeklyCatalog = {
    alchemy = {
        weeklyQuest = { 93690 },
        treatise = { 95127 },
        knowledgeDrops = {
            { 93528 },
            { 93529 }
        }
    },
    blacksmithing = {
        weeklyQuest = { 93691 },
        treatise = { 95128 },
        knowledgeDrops = {
            { 93530 },
            { 93531 }
        }
    },
    enchanting = {
        weeklyQuest = { 93697, 93698, 93699 },
        treatise = { 95129 },
        knowledgeDrops = {
            { 93532 },
            { 93533 },
            { 95048, 95049, 95050, 95051, 95052 },
            { 95053 }
        }
    },
    engineering = {
        weeklyQuest = { 93692 },
        treatise = { 95138 },
        knowledgeDrops = {
            { 93534 },
            { 93535 }
        }
    },
    herbalism = {
        weeklyQuest = { 93700, 93701, 93702, 93703, 93704 },
        treatise = { 95130 },
        knowledgeDrops = {
            { 81425, 81426, 81427, 81428, 81429 },
            { 81430 }
        }
    },
    inscription = {
        weeklyQuest = { 93693 },
        treatise = { 95131 },
        knowledgeDrops = {
            { 93536 },
            { 93537 }
        }
    },
    jewelcrafting = {
        weeklyQuest = { 93694 },
        treatise = { 95133 },
        knowledgeDrops = {
            { 93538 },
            { 93539 }
        }
    },
    leatherworking = {
        weeklyQuest = { 93695 },
        treatise = { 95134 },
        knowledgeDrops = {
            { 93540 },
            { 93541 }
        }
    },
    mining = {
        weeklyQuest = { 93705, 93706, 93707, 93708, 93709 },
        treatise = { 95135 },
        knowledgeDrops = {
            { 88673, 88674, 88675, 88676, 88677 },
            { 88678 }
        }
    },
    skinning = {
        weeklyQuest = { 93710, 93711, 93712, 93713, 93714 },
        treatise = { 95136 },
        knowledgeDrops = {
            { 88534, 88549, 88536, 88537, 88530 },
            { 88529 }
        }
    },
    tailoring = {
        weeklyQuest = { 93696 },
        treatise = { 95137 },
        knowledgeDrops = {
            { 93542 },
            { 93543 }
        }
    }
}
