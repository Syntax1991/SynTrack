local _, PT = ...

--[[
    Candidate weekly-quest/Treatise identities per profession - see the
    Automatic Profession Weekly audit. weeklyQuest ids were corrected
    2026-08-28 from a sequential, internally-consistent reference table
    the user supplied (93690-93714, one contiguous block covering all
    11 professions) - the original Blizzard-forums-thread numbers
    (9352x-9354x) were superseded and are no longer used. Treatise ids
    remain forum-sourced/unverified. The addon captures raw flag
    evidence for every candidate here regardless; NONE of it reaches a
    user until the matching backend ProfessionWeeklySourceDefinition is
    explicitly enabled after live verification (enabled defaults to
    false - see the Prisma schema). Gathering professions list multiple
    quest ids (per-node/zone turn-in variants of the same weekly).

    UNKNOWN > WRONG: this file only ever adds candidates to check. It
    never decides what a user sees - that gate lives entirely on the
    backend.
]]
PT.ProfessionWeeklyCatalog = {
    alchemy = {
        weeklyQuest = { 93690 },
        treatise = { 95127 }
    },
    blacksmithing = {
        weeklyQuest = { 93691 },
        treatise = { 95128 }
    },
    enchanting = {
        weeklyQuest = { 93697, 93698, 93699 },
        treatise = { 95129 }
    },
    engineering = {
        weeklyQuest = { 93692 },
        treatise = { 95138 }
    },
    herbalism = {
        weeklyQuest = { 93700, 93701, 93702, 93703, 93704 },
        treatise = { 95130 }
    },
    inscription = {
        weeklyQuest = { 93693 },
        treatise = { 95131 }
    },
    jewelcrafting = {
        weeklyQuest = { 93694 },
        treatise = { 95133 }
    },
    leatherworking = {
        weeklyQuest = { 93695 },
        treatise = { 95134 }
    },
    mining = {
        weeklyQuest = { 93705, 93706, 93707, 93708, 93709 },
        treatise = { 95135 }
    },
    skinning = {
        weeklyQuest = { 93710, 93711, 93712, 93713, 93714 },
        treatise = { 95136 }
    },
    tailoring = {
        weeklyQuest = { 93696 },
        treatise = { 95137 }
    }
}
