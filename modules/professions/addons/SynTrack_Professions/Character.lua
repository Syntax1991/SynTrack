local _, PT = ...

local function getCharacterIdentity()
    local name =
        UnitName("player")
        or "Unknown"

    local realm =
        PT.GetRealm()

    local region =
        PT.GetRegion()

    local className,
        _,
        classId =
        UnitClass("player")

    return {
        name = name,
        realm = realm,
        region = region,
        className =
            className
            or "Unknown",
        classId =
            classId
            or 0,
        level =
            UnitLevel("player")
            or 0
    }
end

local function createCharacterKey(
    identity
)
    return table.concat(
        {
            PT.NormalizeKeyPart(
                identity.region
            ),
            PT.NormalizeKeyPart(
                identity.realm
            ),
            PT.NormalizeKeyPart(
                identity.name
            )
        },
        ":"
    )
end

function PT.RefreshCharacter(
    reason
)
    if not UnitExists("player") then
        return nil
    end

    local database =
        PT.EnsureDatabase()

    local identity =
        getCharacterIdentity()

    local characterKey =
        createCharacterKey(
            identity
        )

    local existingCharacter =
        database.characters[
            characterKey
        ]
        or {}

    existingCharacter.key =
        characterKey

    existingCharacter.name =
        identity.name

    existingCharacter.realm =
        identity.realm

    existingCharacter.region =
        identity.region

    existingCharacter.className =
        identity.className

    existingCharacter.classId =
        identity.classId

    existingCharacter.level =
        identity.level

    existingCharacter.professions =
        PT.CollectProfessions
        and PT.CollectProfessions(
            existingCharacter.professions
        )
        or {}

    existingCharacter.professionWeekly =
        PT.CaptureProfessionWeekly
        and PT.CaptureProfessionWeekly(
            existingCharacter.professions
        )
        or nil

    existingCharacter.professionKnowledgeTreasures =
        PT.CaptureProfessionKnowledgeTreasures
        and PT.CaptureProfessionKnowledgeTreasures(
            existingCharacter.professions
        )
        or nil

    existingCharacter.lastUpdatedAt =
        time()

    existingCharacter.snapshotReason =
        reason
        or "unknown"

    database.characters[
        characterKey
    ] =
        existingCharacter

    if PT.PruneCharacterRecipeOperationsForProfessions then
        PT.PruneCharacterRecipeOperationsForProfessions(
            characterKey,
            existingCharacter.professions
        )
    end

    database.lastUpdatedAt =
        time()

    return existingCharacter
end