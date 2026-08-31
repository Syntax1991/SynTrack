local _, private = ...

local function pcallResult(api, ...)
    if type(api) ~= "function" then
        return nil
    end

    local succeeded, result = pcall(api, ...)

    if not succeeded then
        return nil
    end

    return result
end

local function enumTypes()
    local types = {}
    local enum = Enum and Enum.WeeklyRewardChestThresholdType

    if type(enum) ~= "table" then
        return types
    end

    for name, value in pairs(enum) do
        if type(name) == "string" and type(value) == "number" then
            table.insert(types, {
                name = name,
                value = value
            })
        end
    end

    return types
end

local function vaultTypeName(typeId)
    local types = enumTypes()

    for index = 1, #types do
        if types[index].value == typeId then
            return types[index].name
        end
    end

    return nil
end

local function activityKey(activityType, activityIndex)
    return tostring(activityType) .. ":" .. tostring(activityIndex)
end

local function scalarExtras(activity)
    local extras = {}
    local known = {
        type = true,
        index = true,
        threshold = true,
        progress = true,
        id = true,
        level = true,
        activityTierID = true,
        claimID = true,
        raidString = true,
        rewards = true
    }

    for key, value in pairs(activity) do
        local kind = type(value)

        if not known[key]
            and (kind == "number" or kind == "string" or kind == "boolean")
        then
            extras[key] = value
        end
    end

    return extras
end

local function addActivities(target, seen, list, requestedType, requestedTypeName)
    if type(list) ~= "table" then
        return
    end

    for _, activity in ipairs(list) do
        if type(activity) == "table" then
            local activityType = activity.type or requestedType

            if type(activityType) == "number" then
                local activityIndex = activity.index
                local key = activityKey(activityType, activityIndex)

                if not seen[key] then
                    seen[key] = true
                    table.insert(target, {
                        type = activityType,
                        typeName = vaultTypeName(activityType)
                            or requestedTypeName,
                        index = activityIndex,
                        threshold = activity.threshold,
                        progress = activity.progress,
                        id = activity.id,
                        level = activity.level,
                        activityTierID = activity.activityTierID,
                        claimID = activity.claimID,
                        raidString = activity.raidString,
                        extras = scalarExtras(activity)
                    })
                end
            end
        end
    end
end

local function fetchTypeList()
    local types = enumTypes()

    if #types > 0 then
        return types
    end

    return {
        { name = "Activities", value = 1 },
        { name = "Raid", value = 3 },
        { name = "World", value = 6 }
    }
end

function private.CaptureWeeklyVault()
    if not C_WeeklyRewards then
        return { captured = false }
    end

    local generated =
        pcallResult(C_WeeklyRewards.HasGeneratedRewards)
    local currentPeriod =
        pcallResult(C_WeeklyRewards.AreRewardsForCurrentRewardPeriod)
    local canClaim =
        pcallResult(C_WeeklyRewards.CanClaimRewards)
    local hasAvailable =
        pcallResult(C_WeeklyRewards.HasAvailableRewards)
    local activities = {}
    local seen = {}

    addActivities(
        activities,
        seen,
        pcallResult(C_WeeklyRewards.GetActivities),
        nil,
        nil
    )

    local types = fetchTypeList()

    for index = 1, #types do
        local entry = types[index]

        if entry.value > 0 then
            addActivities(
                activities,
                seen,
                pcallResult(
                    C_WeeklyRewards.GetActivities,
                    entry.value
                ),
                entry.value,
                entry.name
            )
        end
    end

    if type(generated) ~= "boolean"
        and type(currentPeriod) ~= "boolean"
        and #activities == 0
    then
        return { captured = false }
    end

    local captured = true

    if #activities == 0 and currentPeriod ~= true then
        captured = false
    end

    return {
        captured = captured,
        generated = generated,
        currentPeriod = currentPeriod,
        canClaim = canClaim,
        hasAvailable = hasAvailable,
        enumTypes = types,
        activities = activities
    }
end
