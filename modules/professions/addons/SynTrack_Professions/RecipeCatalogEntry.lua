local _, PT = ...

local function getRecipeInfo(recipeID)
    if not C_TradeSkillUI
        or not C_TradeSkillUI.GetRecipeInfo
    then
        return nil
    end

    local success,
        recipeInfo =
        pcall(
            C_TradeSkillUI.GetRecipeInfo,
            recipeID
        )

    if not success then
        return nil
    end

    return recipeInfo
end

local function getCategoryInfo(categoryID)
    if not categoryID
        or categoryID == 0
        or not C_TradeSkillUI
        or not C_TradeSkillUI.GetCategoryInfo
    then
        return nil
    end

    local success,
        categoryInfo =
        pcall(
            C_TradeSkillUI.GetCategoryInfo,
            categoryID
        )

    if not success then
        return nil
    end

    return categoryInfo
end

local function getOperationMetrics(recipeID)
    if not PT.GetRecipeOperationSnapshot then
        return nil
    end

    return PT.GetRecipeOperationSnapshot(
        recipeID
    )
end

local function getReagentSchema(recipeID)
    if not PT.GetRecipeReagentSchemaSnapshot then
        return nil
    end

    return PT.GetRecipeReagentSchemaSnapshot(
        recipeID
    )
end

local function getOutputItemInfo(
    reagentSchema
)
    local outputItemID =
        reagentSchema
        and reagentSchema.outputItemID
        or nil

    if not outputItemID then
        return nil,
            nil,
            nil,
            nil,
            nil,
            nil
    end

    local getter = nil

    if C_Item
        and C_Item.GetItemInfoInstant
    then
        getter =
            C_Item.GetItemInfoInstant
    elseif GetItemInfoInstant then
        getter =
            GetItemInfoInstant
    end

    if not getter then
        return outputItemID,
            nil,
            nil,
            nil,
            nil,
            nil
    end

    local success,
        resolvedItemID,
        _,
        _,
        itemEquipLoc,
        _,
        itemClassId,
        itemSubclassId =
        pcall(
            getter,
            outputItemID
        )

    if not success then
        return outputItemID,
            nil,
            nil,
            nil,
            nil,
            nil
    end

    return resolvedItemID
        or outputItemID,
        itemEquipLoc,
        itemClassId,
        itemSubclassId,
        PT.ResolveArmorSubclassKey(
            itemClassId,
            itemSubclassId
        ),
        PT.ResolveWeaponSubclassKey(
            itemClassId,
            itemSubclassId
        )
end

function PT.CreateRecipeCatalogEntry(
    recipeID,
    context
)
    local recipeInfo =
        getRecipeInfo(
            recipeID
        )

    if not recipeInfo then
        return nil,
            "NO_RECIPE_INFO"
    end

    local resolvedRecipeID =
        recipeInfo.recipeID
        or recipeID

    if not resolvedRecipeID then
        return nil,
            "NO_RECIPE_ID"
    end

    local classification =
        PT.ClassifyRecipeForContext(
            resolvedRecipeID,
            recipeInfo,
            context
        )

    if not classification then
        return nil,
            "NO_CLASSIFICATION"
    end

    if not classification.includeInCatalog then
        return nil,
            classification.exclusionReason
            or "EXCLUDED"
    end

    local categoryID =
        recipeInfo.categoryID
        or 0

    local categoryInfo =
        getCategoryInfo(
            categoryID
        )

    local parentCategoryID =
        categoryInfo
        and categoryInfo.parentCategoryID
        or 0

    local parentCategoryInfo =
        getCategoryInfo(
            parentCategoryID
        )

    local operationMetrics =
        getOperationMetrics(
            resolvedRecipeID
        )

    local reagentSchema =
        getReagentSchema(
            resolvedRecipeID
        )

    local outputItemID,
        outputItemEquipLoc,
        outputItemClassId,
        outputItemSubclassId,
        outputItemArmorSubclassKey,
        outputItemWeaponSubclassKey =
        getOutputItemInfo(
            reagentSchema
        )

    local operationEligible =
        classification.hasCraftingOperationInfo
        or operationMetrics ~= nil

    return {
        recipeId =
            resolvedRecipeID,

        name =
            recipeInfo.name
            or (
                "Recipe "
                .. tostring(
                    resolvedRecipeID
                )
            ),

        categoryId =
            categoryID,

        categoryName =
            categoryInfo
            and categoryInfo.name
            or nil,

        parentCategoryId =
            parentCategoryID,

        parentCategoryName =
            parentCategoryInfo
            and parentCategoryInfo.name
            or nil,

        outputItemId =
            outputItemID,

        outputItemEquipLoc =
            outputItemEquipLoc,

        outputItemClassId =
            outputItemClassId,

        outputItemSubclassId =
            outputItemSubclassId,

        outputItemArmorSubclassKey =
            outputItemArmorSubclassKey,

        outputItemWeaponSubclassKey =
            outputItemWeaponSubclassKey,

        skillLineAbilityId =
            recipeInfo.skillLineAbilityID,

        scopeStatus =
            classification.scopeStatus,

        recipeProfessionId =
            classification.recipeProfessionId,

        recipeParentProfessionId =
            classification.recipeParentProfessionId,

        recipeExpansionName =
            classification.recipeExpansionName,

        supportsQualities =
            recipeInfo.supportsQualities
            == true,

        supportsCraftingStats =
            recipeInfo.supportsCraftingStats
            == true,

        hasCraftingOperationInfo =
            classification.hasCraftingOperationInfo,

        operationEligible =
            operationEligible,

        baseDifficulty =
            operationMetrics
            and operationMetrics.baseDifficulty
            or nil,

        operationMetrics =
            operationMetrics,

        reagentSchema =
            reagentSchema,

        learned =
            recipeInfo.learned
            == true
    },
        nil
end