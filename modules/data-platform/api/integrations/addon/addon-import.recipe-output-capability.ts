export type RecipeOutputSlot = {
  key: string;
  name: string;
};

const outputSlots:
  Record<
    string,
    RecipeOutputSlot
  > = {
    INVTYPE_HEAD: {
      key: "HEAD",
      name: "Head"
    },

    INVTYPE_NECK: {
      key: "NECK",
      name: "Neck"
    },

    INVTYPE_SHOULDER: {
      key: "SHOULDER",
      name: "Shoulder"
    },

    INVTYPE_CLOAK: {
      key: "BACK",
      name: "Back"
    },

    INVTYPE_CHEST: {
      key: "CHEST",
      name: "Chest"
    },

    INVTYPE_ROBE: {
      key: "CHEST",
      name: "Chest"
    },

    INVTYPE_WRIST: {
      key: "WRIST",
      name: "Wrist"
    },

    INVTYPE_HAND: {
      key: "HANDS",
      name: "Hands"
    },

    INVTYPE_WAIST: {
      key: "WAIST",
      name: "Waist"
    },

    INVTYPE_LEGS: {
      key: "LEGS",
      name: "Legs"
    },

    INVTYPE_FEET: {
      key: "FEET",
      name: "Feet"
    },

    INVTYPE_FINGER: {
      key: "FINGER",
      name: "Ring"
    },

    INVTYPE_TRINKET: {
      key: "TRINKET",
      name: "Trinket"
    },

    INVTYPE_WEAPON: {
      key: "ONE_HAND",
      name: "One-Hand Weapon"
    },

    INVTYPE_WEAPONMAINHAND: {
      key: "MAIN_HAND",
      name: "Main Hand"
    },

    INVTYPE_WEAPONOFFHAND: {
      key: "OFF_HAND",
      name: "Off Hand"
    },

    INVTYPE_2HWEAPON: {
      key: "TWO_HAND",
      name: "Two-Hand"
    },

    INVTYPE_SHIELD: {
      key: "OFF_HAND",
      name: "Shield"
    },

    INVTYPE_HOLDABLE: {
      key: "OFF_HAND",
      name: "Off Hand"
    },

    INVTYPE_RANGED: {
      key: "RANGED",
      name: "Ranged"
    },

    INVTYPE_RANGEDRIGHT: {
      key: "RANGED",
      name: "Ranged"
    },

    INVTYPE_PROFESSION_TOOL: {
      key: "PROFESSION_TOOL",
      name: "Profession Tool"
    },

    INVTYPE_PROFESSION_GEAR: {
      key: "PROFESSION_ACCESSORY",
      name: "Profession Accessory"
    }
  };

const equipmentFamilies = [
  {
    key: "CLOTH",
    name: "Cloth",
    aliases: [
      "cloth equipment",
      "cloth armor"
    ]
  },
  {
    key: "LEATHER",
    name: "Leather",
    aliases: [
      "leather equipment",
      "leather armor"
    ]
  },
  {
    key: "MAIL",
    name: "Mail",
    aliases: [
      "mail equipment",
      "mail armor"
    ]
  },
  {
    key: "PLATE",
    name: "Plate",
    aliases: [
      "plate equipment",
      "plate armor"
    ]
  }
] as const;

/*
 * Keyed by Enum.ItemArmorSubclass's own key spelling, resolved live by the
 * addon (RecipeCatalogEntry.lua, resolveArmorSubclassKey) against the
 * running client's actual enum table. This is a stable, non-localized
 * Blizzard-internal token backed by a real numeric item subclass ID -
 * never guessed from a player-facing display string - so a match here is
 * VERIFIED, unlike the category-name-derived fallback below.
 */
const armorSubclassKeyToFamily:
  Record<
    string,
    { key: string; name: string }
  > = {
    Cloth: {
      key: "CLOTH",
      name: "Cloth"
    },

    Leather: {
      key: "LEATHER",
      name: "Leather"
    },

    Mail: {
      key: "MAIL",
      name: "Mail"
    },

    Plate: {
      key: "PLATE",
      name: "Plate"
    }
  };

export function resolveRecipeEquipmentFamilyFromArmorSubclassKey(
  armorSubclassKey: string | null
): {
  key: string;
  name: string;
} | null {
  if (!armorSubclassKey) {
    return null;
  }

  return (
    armorSubclassKeyToFamily[
      armorSubclassKey
    ] ??
    null
  );
}

/*
 * Keyed by Enum.ItemWeaponSubclass's own key spelling, resolved live by
 * the addon (RecipeCatalogEntry.lua, resolveWeaponSubclassKey) against
 * the running client's actual enum table - the exact same reversal
 * pattern as armorSubclassKeyToFamily above, never a hardcoded numeric
 * constant. Handedness (ONE_HAND/TWO_HAND/OFF_HAND/RANGED/MAIN_HAND) is
 * NOT derived here - it already comes from outputItemEquipLoc via
 * resolveRecipeOutputSlot below, so a "1H"/"2H" suffix on the Blizzard
 * enum key (Sword1H vs Sword2H, Axe1H vs Axe2H, Mace1H vs Mace2H) is
 * stripped to the shared weapon type; the slot capability already carries
 * the handedness distinction.
 */
const weaponSubclassKeyToType:
  Record<
    string,
    { key: string; name: string }
  > = {
    Axe1H: { key: "AXE", name: "Axe" },
    Axe2H: { key: "AXE", name: "Axe" },
    Mace1H: { key: "MACE", name: "Mace" },
    Mace2H: { key: "MACE", name: "Mace" },
    Sword1H: { key: "SWORD", name: "Sword" },
    Sword2H: { key: "SWORD", name: "Sword" },
    Dagger: { key: "DAGGER", name: "Dagger" },
    Fist: { key: "FIST_WEAPON", name: "Fist Weapon" },
    Polearm: { key: "POLEARM", name: "Polearm" },
    Staff: { key: "STAFF", name: "Staff" },
    Warglaives: { key: "WARGLAIVE", name: "Warglaive" },
    Bows: { key: "BOW", name: "Bow" },
    Guns: { key: "GUN", name: "Gun" },
    Crossbow: { key: "CROSSBOW", name: "Crossbow" },
    Wand: { key: "WAND", name: "Wand" },
    Thrown: { key: "THROWN", name: "Thrown" },
    Spear: { key: "SPEAR", name: "Spear" },
    FishingPole: { key: "FISHING_POLE", name: "Fishing Pole" }
  };

export function resolveRecipeWeaponTypeFromWeaponSubclassKey(
  weaponSubclassKey: string | null
): {
  key: string;
  name: string;
} | null {
  if (!weaponSubclassKey) {
    return null;
  }

  return (
    weaponSubclassKeyToType[
      weaponSubclassKey
    ] ??
    null
  );
}

export function resolveRecipeOutputSlot(
  equipLoc: string | null
): RecipeOutputSlot | null {
  if (!equipLoc) {
    return null;
  }

  return (
    outputSlots[
      equipLoc
    ] ??
    null
  );
}

/*
 * DERIVED, not VERIFIED: this substring-matches the recipe's own
 * trade-skill category display name. It is recipe-scoped (a fixed fact
 * about the recipe, not a per-character guess), so it is far safer than
 * the deleted specialization-name inference, but it is still a
 * localized-text interpretation. Used only as a fallback for recipes
 * captured before outputItemArmorSubclassKey existed, or where Blizzard's
 * client did not expose a resolvable armor subclass for the output item.
 */
export function resolveRecipeEquipmentFamily(
  categoryName: string | null
): {
  key: string;
  name: string;
} | null {
  if (!categoryName) {
    return null;
  }

  const normalized =
    categoryName
      .trim()
      .toLocaleLowerCase(
        "en"
      );

  const definition =
    equipmentFamilies.find(
      (family) =>
        family.aliases.some(
          (alias) =>
            normalized === alias ||
            normalized.includes(
              alias
            )
        )
    );

  return definition
    ? {
        key:
          definition.key,
        name:
          definition.name
      }
    : null;
}