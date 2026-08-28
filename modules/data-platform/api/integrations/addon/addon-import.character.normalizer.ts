import { normalizeExpansion } from "./addon-import.expansion.normalizer.js";
import { normalizeGearSnapshot } from "./addon-import.gear.normalizer.js";
import { normalizeResourceSnapshot } from "./addon-import.resource.normalizer.js";
import { normalizeProfessionWeeklySnapshot } from "./addon-import.profession-weekly.normalizer.js";
import type {
  AddonCharacter,
  AddonExpansion,
  AddonProfession,
  AddonProfessionCatalog,
  LuaValue
} from "./addon-import.types.js";
import {
  asNumber,
  asString,
  asTable,
  normalizeProfessionKey,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";

type CatalogMap =
  Map<
    number,
    AddonProfessionCatalog
  >;

function normalizeProfession(
  value: LuaValue,
  catalogs:
    CatalogMap
): AddonProfession | null {
  const profession =
    asTable(
      value
    );

  if (!profession) {
    return null;
  }

  const name =
    asString(
      profession.name
    ) ??
    "Unknown";

  const expansionTable =
    asTable(
      profession.expansions
    );

  const expansions:
    AddonExpansion[] =
    expansionTable
      ? Object.entries(
          expansionTable
        )
          .map(
            ([
              key,
              expansion
            ]) => {
              const numericKey =
                Number(
                  key
                );

              const catalog =
                Number.isFinite(
                  numericKey
                )
                  ? (
                      catalogs.get(
                        numericKey
                      ) ??
                      null
                    )
                  : null;

              return normalizeExpansion(
                key,
                expansion,
                catalog
              );
            }
          )
          .filter(
            (
              expansion
            ): expansion is AddonExpansion =>
              expansion !== null
          )
          .sort(
            (
              left,
              right
            ) =>
              left.skillLineId -
              right.skillLineId
          )
      : [];

  return {
    name,

    professionKey:
      normalizeProfessionKey(
        name
      ),

    skillLineId:
      asNumber(
        profession.skillLineId
      ),

    skillLevel:
      asNumber(
        profession.skillLevel
      ) ??
      0,

    maxSkillLevel:
      asNumber(
        profession.maxSkillLevel
      ) ??
      0,

    skillModifier:
      asNumber(
        profession.skillModifier
      ) ??
      0,

    activeExpansionSkillLineId:
      asNumber(
        profession
          .activeExpansionSkillLineId
      ),

    expansions
  };
}

export function normalizeCharacter(
  key: string,
  value: LuaValue,
  catalogs:
    CatalogMap
): AddonCharacter | null {
  const character =
    asTable(
      value
    );

  if (!character) {
    return null;
  }

  const professions =
    numericValues(
      asTable(
        character.professions
      )
    )
      .map(
        (profession) =>
          normalizeProfession(
            profession,
            catalogs
          )
      )
      .filter(
        (
          profession
        ): profession is AddonProfession =>
          profession !== null
      );

  const modules =
    asTable(
      character.modules
    );

  const gear =
    normalizeGearSnapshot(
      modules?.gear
    );

  const resources =
    normalizeResourceSnapshot(
      modules?.resources
    );

  const professionWeekly =
    normalizeProfessionWeeklySnapshot(
      character.professionWeekly
    );

  return {
    key,

    name:
      asString(
        character.name
      ) ??
      key,

    realm:
      asString(
        character.realm
      ) ??
      "Unknown",

    region:
      (
        asString(
          character.region
        ) ??
        "EU"
      ).toLowerCase(),

    className:
      asString(
        character.className
      ) ??
      "Unknown",

    level:
      asNumber(
        character.level
      ) ??
      0,

    snapshotReason:
      asString(
        character.snapshotReason
      ),

    lastUpdatedAt:
      unixTimestampToIso(
        character.lastUpdatedAt
      ),

    professions,
    gear,
    resources,
    professionWeekly
  };
}