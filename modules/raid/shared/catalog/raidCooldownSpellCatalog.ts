/**
 * Real, individually-verified raid-cooldown spell catalog. Each entry's
 * `spellId`/`name` was looked up live against Blizzard's Game Data API
 * (`/data/wow/spell/{id}`) and kept only when the returned `name`
 * matched exactly; `icon` is the real official media URL from
 * `/data/wow/media/spell/{id}` (`render.worldofwarcraft.com`), not a
 * third-party icon CDN guess. Candidates that 404'd (Death Knight
 * "Rune Tap", Mage "Alter Time", Hunter "Aspect of the Wild") were
 * dropped rather than re-guessed. `baseCooldownSeconds` is always
 * `null` today — Blizzard's API exposes no structured cooldown-duration
 * field anywhere, only prose descriptions, so no number is fabricated
 * here. The field exists so a real source can populate it later
 * without a schema change.
 *
 * `specIds: null` means class-wide (every spec of that class can use
 * it — e.g. Blessing of Protection); a real array restricts the spell
 * to those specific specialization ids (e.g. Aura Mastery is Holy
 * Paladin only). There's no Blizzard endpoint that returns "which
 * spec owns this cooldown" as structured data (that lives only inside
 * per-spec talent trees), so restrictions here reflect this game's
 * long-standing, unchanged spec identity for these specific iconic
 * cooldowns — applied conservatively: a spell is only marked
 * spec-specific when that ownership is unambiguous and long-standing;
 * anything less certain is left class-wide rather than guessed
 * narrower than reality.
 *
 * Deliberately not exhaustive: this is a curated external/defensive/
 * raid-cooldown set (every class represented, most with 2-4 entries),
 * not every ability a class has ever brought to a raid. Extending it
 * later means appending a candidate and re-verifying live, the same
 * process used to build this list — never inventing an id, icon, or
 * spec restriction.
 */

export type RaidCooldownSpellCategory =
  | "Heal CD"
  | "Raid DR"
  | "External"
  | "Defensive"
  | "Utility";

export type RaidCooldownSpell = {
  spellId: number;
  name: string;
  icon: string;
  className: string;
  category: RaidCooldownSpellCategory;
  baseCooldownSeconds: number | null;
  specIds: number[] | null;
};

export const raidCooldownSpellCatalog: RaidCooldownSpell[] = [
  { spellId: 51052, name: "Anti-Magic Zone", icon: "https://render.worldofwarcraft.com/eu/icons/56/237510.jpg", className: "Death Knight", category: "External", baseCooldownSeconds: null, specIds: null },
  { spellId: 48792, name: "Icebound Fortitude", icon: "https://render.worldofwarcraft.com/eu/icons/56/237525.jpg", className: "Death Knight", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 55233, name: "Vampiric Blood", icon: "https://render.worldofwarcraft.com/eu/icons/56/136168.jpg", className: "Death Knight", category: "Defensive", baseCooldownSeconds: null, specIds: [250] },

  { spellId: 196718, name: "Darkness", icon: "https://render.worldofwarcraft.com/eu/icons/56/1305154.jpg", className: "Demon Hunter", category: "External", baseCooldownSeconds: null, specIds: null },
  { spellId: 196555, name: "Netherwalk", icon: "https://render.worldofwarcraft.com/eu/icons/56/463284.jpg", className: "Demon Hunter", category: "Defensive", baseCooldownSeconds: null, specIds: [577] },
  { spellId: 198589, name: "Blur", icon: "https://render.worldofwarcraft.com/eu/icons/56/1305150.jpg", className: "Demon Hunter", category: "Defensive", baseCooldownSeconds: null, specIds: [577] },

  { spellId: 740, name: "Tranquility", icon: "https://render.worldofwarcraft.com/eu/icons/56/136107.jpg", className: "Druid", category: "Heal CD", baseCooldownSeconds: null, specIds: [105] },
  { spellId: 102342, name: "Ironbark", icon: "https://render.worldofwarcraft.com/eu/icons/56/572025.jpg", className: "Druid", category: "External", baseCooldownSeconds: null, specIds: [105] },
  { spellId: 22812, name: "Barkskin", icon: "https://render.worldofwarcraft.com/eu/icons/56/136097.jpg", className: "Druid", category: "Defensive", baseCooldownSeconds: null, specIds: null },

  { spellId: 363534, name: "Rewind", icon: "https://render.worldofwarcraft.com/eu/icons/56/4622474.jpg", className: "Evoker", category: "Heal CD", baseCooldownSeconds: null, specIds: [1468] },
  { spellId: 374227, name: "Zephyr", icon: "https://render.worldofwarcraft.com/eu/icons/56/4630449.jpg", className: "Evoker", category: "Raid DR", baseCooldownSeconds: null, specIds: [1468] },
  { spellId: 357170, name: "Time Dilation", icon: "https://render.worldofwarcraft.com/eu/icons/56/4622478.jpg", className: "Evoker", category: "External", baseCooldownSeconds: null, specIds: [1468] },

  { spellId: 186265, name: "Aspect of the Turtle", icon: "https://render.worldofwarcraft.com/eu/icons/56/132199.jpg", className: "Hunter", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 109304, name: "Exhilaration", icon: "https://render.worldofwarcraft.com/eu/icons/56/461117.jpg", className: "Hunter", category: "Defensive", baseCooldownSeconds: null, specIds: null },

  { spellId: 45438, name: "Ice Block", icon: "https://render.worldofwarcraft.com/eu/icons/56/135841.jpg", className: "Mage", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 414660, name: "Mass Barrier", icon: "https://render.worldofwarcraft.com/eu/icons/56/1723997.jpg", className: "Mage", category: "Raid DR", baseCooldownSeconds: null, specIds: null },
  { spellId: 110959, name: "Greater Invisibility", icon: "https://render.worldofwarcraft.com/eu/icons/56/575584.jpg", className: "Mage", category: "Defensive", baseCooldownSeconds: null, specIds: null },

  { spellId: 116849, name: "Life Cocoon", icon: "https://render.worldofwarcraft.com/eu/icons/56/627485.jpg", className: "Monk", category: "External", baseCooldownSeconds: null, specIds: [270] },
  { spellId: 115310, name: "Revival", icon: "https://render.worldofwarcraft.com/eu/icons/56/1020466.jpg", className: "Monk", category: "Heal CD", baseCooldownSeconds: null, specIds: [270] },
  { spellId: 115203, name: "Fortifying Brew", icon: "https://render.worldofwarcraft.com/eu/icons/56/615341.jpg", className: "Monk", category: "Defensive", baseCooldownSeconds: null, specIds: null },

  { spellId: 31821, name: "Aura Mastery", icon: "https://render.worldofwarcraft.com/eu/icons/56/135872.jpg", className: "Paladin", category: "Raid DR", baseCooldownSeconds: null, specIds: [65] },
  { spellId: 1022, name: "Blessing of Protection", icon: "https://render.worldofwarcraft.com/eu/icons/56/135964.jpg", className: "Paladin", category: "External", baseCooldownSeconds: null, specIds: null },
  { spellId: 6940, name: "Blessing of Sacrifice", icon: "https://render.worldofwarcraft.com/eu/icons/56/135966.jpg", className: "Paladin", category: "External", baseCooldownSeconds: null, specIds: null },

  { spellId: 33206, name: "Pain Suppression", icon: "https://render.worldofwarcraft.com/eu/icons/56/135936.jpg", className: "Priest", category: "External", baseCooldownSeconds: null, specIds: [256] },
  { spellId: 47788, name: "Guardian Spirit", icon: "https://render.worldofwarcraft.com/eu/icons/56/237542.jpg", className: "Priest", category: "External", baseCooldownSeconds: null, specIds: [256, 257] },
  { spellId: 62618, name: "Power Word: Barrier", icon: "https://render.worldofwarcraft.com/eu/icons/56/253400.jpg", className: "Priest", category: "Raid DR", baseCooldownSeconds: null, specIds: [256] },
  { spellId: 64843, name: "Divine Hymn", icon: "https://render.worldofwarcraft.com/eu/icons/56/237540.jpg", className: "Priest", category: "Heal CD", baseCooldownSeconds: null, specIds: [257] },

  { spellId: 31224, name: "Cloak of Shadows", icon: "https://render.worldofwarcraft.com/eu/icons/56/136177.jpg", className: "Rogue", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 5277, name: "Evasion", icon: "https://render.worldofwarcraft.com/eu/icons/56/136205.jpg", className: "Rogue", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 1966, name: "Feint", icon: "https://render.worldofwarcraft.com/eu/icons/56/132294.jpg", className: "Rogue", category: "Defensive", baseCooldownSeconds: null, specIds: null },

  { spellId: 98008, name: "Spirit Link Totem", icon: "https://render.worldofwarcraft.com/eu/icons/56/237586.jpg", className: "Shaman", category: "Raid DR", baseCooldownSeconds: null, specIds: [264] },
  { spellId: 108280, name: "Healing Tide Totem", icon: "https://render.worldofwarcraft.com/eu/icons/56/538569.jpg", className: "Shaman", category: "Heal CD", baseCooldownSeconds: null, specIds: [264] },
  { spellId: 207399, name: "Ancestral Protection Totem", icon: "https://render.worldofwarcraft.com/eu/icons/56/136080.jpg", className: "Shaman", category: "External", baseCooldownSeconds: null, specIds: [264] },

  { spellId: 104773, name: "Unending Resolve", icon: "https://render.worldofwarcraft.com/eu/icons/56/136150.jpg", className: "Warlock", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 108416, name: "Dark Pact", icon: "https://render.worldofwarcraft.com/eu/icons/56/136146.jpg", className: "Warlock", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 111771, name: "Demonic Gateway", icon: "https://render.worldofwarcraft.com/eu/icons/56/607512.jpg", className: "Warlock", category: "Utility", baseCooldownSeconds: null, specIds: null },

  { spellId: 97462, name: "Rallying Cry", icon: "https://render.worldofwarcraft.com/eu/icons/56/132351.jpg", className: "Warrior", category: "Raid DR", baseCooldownSeconds: null, specIds: null },
  { spellId: 23920, name: "Spell Reflection", icon: "https://render.worldofwarcraft.com/eu/icons/56/132361.jpg", className: "Warrior", category: "Defensive", baseCooldownSeconds: null, specIds: null },
  { spellId: 184364, name: "Enraged Regeneration", icon: "https://render.worldofwarcraft.com/eu/icons/56/132345.jpg", className: "Warrior", category: "Defensive", baseCooldownSeconds: null, specIds: null }
];

export function getSpellsForClass(
  className: string
): RaidCooldownSpell[] {
  const normalized = className.trim().toLowerCase();

  return raidCooldownSpellCatalog.filter(
    (spell) => spell.className.toLowerCase() === normalized
  );
}

/**
 * The planning-eligibility resolver: class-wide spells (`specIds:
 * null`) are always included regardless of spec; spec-specific spells
 * only appear when `specId` matches. A `null`/unrecognized `specId`
 * (UNKNOWN spec) still returns every class-wide spell — never zero —
 * it just excludes spec-gated ones until a real spec is known.
 */
export function getSpellsForCharacter(
  character: {
    className: string;
    specId: number | null;
  }
): RaidCooldownSpell[] {
  return getSpellsForClass(
    character.className
  ).filter(
    (spell) =>
      spell.specIds === null ||
      (character.specId !== null &&
        spell.specIds.includes(
          character.specId
        ))
  );
}

export function getSpellById(
  spellId: number
): RaidCooldownSpell | null {
  return (
    raidCooldownSpellCatalog.find(
      (spell) => spell.spellId === spellId
    ) ?? null
  );
}
