local _, PT = ...

local excludedOperationMetricKeys = {
    recipeID = true,
    craftingDataID = true
}

local function isScalarValue(
    value
)
    local valueType =
        type(value)

    return valueType == "number"
        or valueType == "string"
        or valueType == "boolean"
end

function PT.CreateCompactRecipeOperationMetrics(
    source
)
    if type(source) ~= "table" then
        return nil
    end

    local result = {}

    for key, value in pairs(
        source
    ) do
        local keep =
            type(key) == "string"
            and not excludedOperationMetricKeys[
                key
            ]
            and isScalarValue(
                value
            )

        if keep then
            result[key] =
                value
        end
    end

    if next(result) == nil then
        return nil
    end

    return result
end

local function createCompactRecipe(
    recipe
)
    if type(recipe) ~= "table"
        or not recipe.recipeId
    then
        return nil
    end

    local operationMetrics =
        PT.CreateCompactRecipeOperationMetrics(
            recipe.operationMetrics
        )

    local operationEligible =
        recipe.operationEligible == true
        or recipe.hasCraftingOperationInfo
            == true
        or operationMetrics ~= nil

    return {
        recipeId =
            recipe.recipeId,

        name =
            recipe.name,

        categoryId =
            recipe.categoryId,

        categoryName =
            recipe.categoryName,

        parentCategoryId =
            recipe.parentCategoryId,

        parentCategoryName =
            recipe.parentCategoryName,

        outputItemId =
            recipe.outputItemId,

        outputItemEquipLoc =
            recipe.outputItemEquipLoc,

        outputItemClassId =
            recipe.outputItemClassId,

        outputItemSubclassId =
            recipe.outputItemSubclassId,

        outputItemArmorSubclassKey =
            recipe.outputItemArmorSubclassKey,

        outputItemWeaponSubclassKey =
            recipe.outputItemWeaponSubclassKey,

        skillLineAbilityId =
            recipe.skillLineAbilityId,

        operationEligible =
            operationEligible
            and true
            or nil,

        baseDifficulty =
            recipe.baseDifficulty
            or (
                operationMetrics
                and operationMetrics
                    .baseDifficulty
            )
            or nil,

        operationMetrics =
            operationMetrics,

        reagentSchema =
            PT.CreateCompactRecipeReagentSchema(
                recipe.reagentSchema
            )
    }
end

local function createCompactRecipes(
    recipes
)
    local result = {}

    for _, recipe in ipairs(
        recipes
        or {}
    ) do
        local compactRecipe =
            createCompactRecipe(
                recipe
            )

        if compactRecipe then
            table.insert(
                result,
                compactRecipe
            )
        end
    end

    return result
end

function PT.CreateCompactRecipeCatalog(
    source
)
    if type(source) ~= "table"
        or not source.skillLineId
    then
        return nil
    end

    return {
        scopeVersion =
            source.scopeVersion,

        skillLineId =
            source.skillLineId,

        displayName =
            source.displayName,

        expansionName =
            source.expansionName,

        sourceRecipeCount =
            source.sourceRecipeCount,

        recipes =
            createCompactRecipes(
                source.recipes
            ),

        capturedAt =
            source.capturedAt
    }
end