/**
 * Real, individually-verified specialization catalog. Every `specId`
 * is a canonical Blizzard `playable-specialization` id — verified
 * live against `/data/wow/playable-specialization/{id}` (name, class,
 * role) and `/data/wow/media/playable-specialization/{id}` (real icon
 * URL, `render.worldofwarcraft.com`, same CDN convention as
 * raidCooldownSpellCatalog.ts). `role` is Blizzard's own
 * `role.type` field (DAMAGE mapped to "DPS" for this app's
 * vocabulary) — not guessed from the spec name.
 *
 * This is the canonical source for "what is this spec called, which
 * class does it belong to, and what role does it fill" — never
 * duplicated as ad-hoc strings ("holy", "ret", "prot") anywhere else
 * in the app. See RaidBossRosterEntry.specId for where a member's
 * per-Setup+Boss selection is actually persisted.
 */

export type SpecRole = "TANK" | "HEALER" | "DPS";

export type RaidSpecialization = {
  specId: number;
  name: string;
  className: string;
  role: SpecRole;
  icon: string;
};

export const raidSpecializationCatalog: RaidSpecialization[] = [
  { specId: 250, name: "Blood", className: "Death Knight", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/135770.jpg" },
  { specId: 251, name: "Frost", className: "Death Knight", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135773.jpg" },
  { specId: 252, name: "Unholy", className: "Death Knight", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135775.jpg" },

  { specId: 577, name: "Havoc", className: "Demon Hunter", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/1247264.jpg" },
  { specId: 581, name: "Vengeance", className: "Demon Hunter", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/1247265.jpg" },

  { specId: 102, name: "Balance", className: "Druid", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136096.jpg" },
  { specId: 103, name: "Feral", className: "Druid", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/132115.jpg" },
  { specId: 104, name: "Guardian", className: "Druid", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/132276.jpg" },
  { specId: 105, name: "Restoration", className: "Druid", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/136041.jpg" },

  { specId: 1467, name: "Devastation", className: "Evoker", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/4511811.jpg" },
  { specId: 1468, name: "Preservation", className: "Evoker", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/4511812.jpg" },
  { specId: 1473, name: "Augmentation", className: "Evoker", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/5198700.jpg" },

  { specId: 253, name: "Beast Mastery", className: "Hunter", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/461112.jpg" },
  { specId: 254, name: "Marksmanship", className: "Hunter", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/236179.jpg" },
  { specId: 255, name: "Survival", className: "Hunter", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/461113.jpg" },

  { specId: 62, name: "Arcane", className: "Mage", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135932.jpg" },
  { specId: 63, name: "Fire", className: "Mage", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135810.jpg" },
  { specId: 64, name: "Frost", className: "Mage", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135846.jpg" },

  { specId: 268, name: "Brewmaster", className: "Monk", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/608951.jpg" },
  { specId: 269, name: "Windwalker", className: "Monk", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/608953.jpg" },
  { specId: 270, name: "Mistweaver", className: "Monk", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/608952.jpg" },

  { specId: 65, name: "Holy", className: "Paladin", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/135920.jpg" },
  { specId: 66, name: "Protection", className: "Paladin", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/236264.jpg" },
  { specId: 70, name: "Retribution", className: "Paladin", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/135873.jpg" },

  { specId: 256, name: "Discipline", className: "Priest", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/135940.jpg" },
  { specId: 257, name: "Holy", className: "Priest", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/237542.jpg" },
  { specId: 258, name: "Shadow", className: "Priest", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136207.jpg" },

  { specId: 259, name: "Assassination", className: "Rogue", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/236270.jpg" },
  { specId: 260, name: "Outlaw", className: "Rogue", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/236286.jpg" },
  { specId: 261, name: "Subtlety", className: "Rogue", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/132320.jpg" },

  { specId: 262, name: "Elemental", className: "Shaman", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136048.jpg" },
  { specId: 263, name: "Enhancement", className: "Shaman", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/237581.jpg" },
  { specId: 264, name: "Restoration", className: "Shaman", role: "HEALER", icon: "https://render.worldofwarcraft.com/eu/icons/56/136052.jpg" },

  { specId: 265, name: "Affliction", className: "Warlock", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136145.jpg" },
  { specId: 266, name: "Demonology", className: "Warlock", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136172.jpg" },
  { specId: 267, name: "Destruction", className: "Warlock", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/136186.jpg" },

  { specId: 71, name: "Arms", className: "Warrior", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/132355.jpg" },
  { specId: 72, name: "Fury", className: "Warrior", role: "DPS", icon: "https://render.worldofwarcraft.com/eu/icons/56/132347.jpg" },
  { specId: 73, name: "Protection", className: "Warrior", role: "TANK", icon: "https://render.worldofwarcraft.com/eu/icons/56/132341.jpg" }
];

export function getSpecById(
  specId: number | null
): RaidSpecialization | null {
  if (specId === null) {
    return null;
  }

  return (
    raidSpecializationCatalog.find(
      (spec) => spec.specId === specId
    ) ?? null
  );
}

export function getSpecsForClass(
  className: string
): RaidSpecialization[] {
  const normalized = className.trim().toLowerCase();

  return raidSpecializationCatalog.filter(
    (spec) => spec.className.toLowerCase() === normalized
  );
}

/**
 * Effective raid role always derives from a known spec — never
 * guessed from class. A member with no selected spec (or an
 * unrecognized id) is UNKNOWN, a valid, permanent state, not an error.
 */
export type EffectiveRole = SpecRole | "UNKNOWN";

export const EFFECTIVE_ROLE_ORDER: EffectiveRole[] = [
  "TANK",
  "HEALER",
  "DPS",
  "UNKNOWN"
];

export const EFFECTIVE_ROLE_LABELS: Record<EffectiveRole, string> = {
  TANK: "Tanks",
  HEALER: "Healers",
  DPS: "DPS",
  UNKNOWN: "Unknown"
};

export function resolveEffectiveRole(
  specId: number | null
): EffectiveRole {
  return getSpecById(specId)?.role ?? "UNKNOWN";
}

/**
 * Foundation-only composition counting — no warnings, no recruitment
 * intelligence, just real counts by effective role for whatever
 * member list is passed in (a boss lineup, a Setup pool, etc.).
 */
export function computeRoleCounts(
  specIds: Array<number | null>
): Record<EffectiveRole, number> {
  const counts: Record<EffectiveRole, number> = {
    TANK: 0,
    HEALER: 0,
    DPS: 0,
    UNKNOWN: 0
  };

  for (const specId of specIds) {
    counts[resolveEffectiveRole(specId)] += 1;
  }

  return counts;
}
