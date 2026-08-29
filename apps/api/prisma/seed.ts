import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { ResourceDefinitionRepository } from "../../../modules/my-syntrack/api/resources/resource-definition.repository.js";
import { ResourceDefinitionService } from "../../../modules/my-syntrack/api/resources/resource-definition.service.js";
import { TrackerScopeProfileRepository } from "../../../modules/my-syntrack/api/trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../../../modules/my-syntrack/api/trackers/tracker-scope-profile.service.js";
import { ProfessionWeeklyDefinitionRepository } from "../../../modules/my-syntrack/api/profession-weekly/profession-weekly-definition.repository.js";
import { ProfessionWeeklyDefinitionService } from "../../../modules/my-syntrack/api/profession-weekly/profession-weekly-definition.service.js";

const adapter = new PrismaBetterSqlite3({
  url:
    process.env.DATABASE_URL ??
    "file:./prisma/dev.db"
});

const prisma = new PrismaClient({
  adapter
});

const professions = [
  {
    key: "alchemy",
    name: "Alchemy",
    category: "CRAFTING",
    order: 10
  },
  {
    key: "blacksmithing",
    name: "Blacksmithing",
    category: "CRAFTING",
    order: 20
  },
  {
    key: "enchanting",
    name: "Enchanting",
    category: "CRAFTING",
    order: 30
  },
  {
    key: "engineering",
    name: "Engineering",
    category: "CRAFTING",
    order: 40
  },
  {
    key: "inscription",
    name: "Inscription",
    category: "CRAFTING",
    order: 50
  },
  {
    key: "jewelcrafting",
    name: "Jewelcrafting",
    category: "CRAFTING",
    order: 60
  },
  {
    key: "leatherworking",
    name: "Leatherworking",
    category: "CRAFTING",
    order: 70
  },
  {
    key: "tailoring",
    name: "Tailoring",
    category: "CRAFTING",
    order: 80
  },
  {
    key: "herbalism",
    name: "Herbalism",
    category: "GATHERING",
    order: 90
  },
  {
    key: "mining",
    name: "Mining",
    category: "GATHERING",
    order: 100
  },
  {
    key: "skinning",
    name: "Skinning",
    category: "GATHERING",
    order: 110
  }
];

type SeedNode = {
  key: string;
  name: string;
  description?: string;
  maxRank?: number;
  sortOrder: number;
};

async function seedProfessions() {
  for (const profession of professions) {
    await prisma.profession.upsert({
      where: {
        key: profession.key
      },
      create: profession,
      update: {
        name: profession.name,
        category: profession.category,
        order: profession.order
      }
    });
  }
}

async function seedBlacksmithingArmorTree() {
  const blacksmithing =
    await prisma.profession.findUnique({
      where: {
        key: "blacksmithing"
      }
    });

  if (!blacksmithing) {
    throw new Error(
      "Blacksmithing profession was not found."
    );
  }

  const tree =
    await prisma.professionSpecializationTree.upsert({
      where: {
        professionId_expansion_key: {
          professionId: blacksmithing.id,
          expansion: "MIDNIGHT",
          key: "armor"
        }
      },
      create: {
        professionId: blacksmithing.id,
        expansion: "MIDNIGHT",
        key: "armor",
        name: "Armor",
        description:
          "Specialization in crafting armor pieces.",
        sortOrder: 10
      },
      update: {
        name: "Armor",
        description:
          "Specialization in crafting armor pieces.",
        sortOrder: 10
      }
    });

  const armorRoot =
    await prisma.professionSpecializationNode.upsert({
      where: {
        treeId_key: {
          treeId: tree.id,
          key: "armor"
        }
      },
      create: {
        treeId: tree.id,
        key: "armor",
        name: "Armor",
        description:
          "Core armor specialization path.",
        sortOrder: 10
      },
      update: {
        parentNodeId: null,
        name: "Armor",
        description:
          "Core armor specialization path.",
        maxRank: null,
        sortOrder: 10
      }
    });

  const armorNodes: SeedNode[] = [
    {
      key: "helm",
      name: "Helms",
      description:
        "Specialization in crafted helms.",
      sortOrder: 10
    },
    {
      key: "shoulders",
      name: "Shoulders",
      description:
        "Specialization in crafted shoulder pieces.",
      sortOrder: 20
    },
    {
      key: "chest",
      name: "Chest",
      description:
        "Specialization in crafted chest pieces.",
      sortOrder: 30
    },
    {
      key: "bracers",
      name: "Bracers",
      description:
        "Specialization in crafted bracers.",
      sortOrder: 40
    },
    {
      key: "gloves",
      name: "Gloves",
      description:
        "Specialization in crafted gloves.",
      sortOrder: 50
    },
    {
      key: "belt",
      name: "Belts",
      description:
        "Specialization in crafted belts.",
      sortOrder: 60
    },
    {
      key: "legs",
      name: "Legs",
      description:
        "Specialization in crafted leg armor.",
      sortOrder: 70
    },
    {
      key: "boots",
      name: "Boots",
      description:
        "Specialization in crafted boots.",
      sortOrder: 80
    },
    {
      key: "shield",
      name: "Shields",
      description:
        "Specialization in crafted shields.",
      sortOrder: 90
    }
  ];

  for (const node of armorNodes) {
    await prisma.professionSpecializationNode.upsert({
      where: {
        treeId_key: {
          treeId: tree.id,
          key: node.key
        }
      },
      create: {
        treeId: tree.id,
        parentNodeId: armorRoot.id,
        key: node.key,
        name: node.name,
        description:
          node.description ?? null,
        maxRank:
          node.maxRank ?? null,
        sortOrder: node.sortOrder
      },
      update: {
        parentNodeId: armorRoot.id,
        name: node.name,
        description:
          node.description ?? null,
        maxRank:
          node.maxRank ?? null,
        sortOrder: node.sortOrder
      }
    });
  }
}

const MIDNIGHT_SEASON_2_SCOPE_KEY = "MIDNIGHT-S2";

/*
 * The pre-existing "MIDNIGHT-S1" scope was a stale placeholder from
 * earlier scaffolding - a real live capture on 2026-08-28 confirmed the
 * account is actually in Midnight Season 2 (the Venomblight Manaflux
 * tooltip explicitly names "Midnight Season 2 Raid Bosses"). Switching
 * active scope never deletes S1's history, it only changes which scope
 * is "active" (see TrackerScopeProfileService).
 */
async function seedMidnightSeason2Profile() {
  const trackerScopeProfileService =
    new TrackerScopeProfileService(
      new TrackerScopeProfileRepository()
    );

  const existing = await trackerScopeProfileService
    .list()
    .then((profiles) =>
      profiles.find(
        (profile) =>
          profile.key ===
          MIDNIGHT_SEASON_2_SCOPE_KEY
      )
    );

  if (!existing) {
    await trackerScopeProfileService.create({
      key: MIDNIGHT_SEASON_2_SCOPE_KEY,
      name: "Midnight Season 2"
    });
  }

  await trackerScopeProfileService.setActive(
    MIDNIGHT_SEASON_2_SCOPE_KEY
  );
}

/*
 * Every id here was independently confirmed against a real live capture
 * on 2026-08-28 (character Synlight, eu-antonidas) - never extrapolated
 * or reused from prior-expansion/pre-cutoff research. Two of the
 * originally-researched candidates turned out to be wrong once checked
 * live: the crest family is "Mistcrest", not "Dawncrest", and the real
 * Season 2 catalyst-equivalent resource is "Venomblight Manaflux"
 * (currencyId 3465), not the stale/undiscovered "Catalyst Charges"
 * (2167). resetBehavior is SEASONAL for all of these because the real
 * captured data showed no canEarnPerWeek/weeklyQuantity evidence for
 * any of them - using WEEKLY would have been an unsupported guess.
 */
async function seedMidnightSeason2Resources() {
  const resourceDefinitionService =
    new ResourceDefinitionService(
      new ResourceDefinitionRepository()
    );

  const definitions = [
    {
      key: "adventurer-mistcrest",
      externalCurrencyId: 3442,
      name: "Adventurer Mistcrest",
      category: "UPGRADE" as const,
      sortOrder: 10
    },
    {
      key: "veteran-mistcrest",
      externalCurrencyId: 3443,
      name: "Veteran Mistcrest",
      category: "UPGRADE" as const,
      sortOrder: 20
    },
    {
      key: "champion-mistcrest",
      externalCurrencyId: 3444,
      name: "Champion Mistcrest",
      category: "UPGRADE" as const,
      sortOrder: 30
    },
    {
      key: "hero-mistcrest",
      externalCurrencyId: 3445,
      name: "Hero Mistcrest",
      category: "UPGRADE" as const,
      sortOrder: 40
    },
    {
      key: "myth-mistcrest",
      externalCurrencyId: 3446,
      name: "Myth Mistcrest",
      category: "UPGRADE" as const,
      sortOrder: 50
    },
    {
      key: "tidal-spark-dust",
      externalCurrencyId: 3509,
      name: "Tidal Spark Dust",
      category: "CRAFTING_GATE" as const,
      sortOrder: 60
    },
    {
      key: "spark-of-tides",
      externalItemId: 274476,
      name: "Spark of Tides",
      category: "CRAFTING_GATE" as const,
      sortOrder: 70
    }
  ];

  for (const definition of definitions) {
    await resourceDefinitionService.ensureDefinition({
      ...definition,
      scopeKey: MIDNIGHT_SEASON_2_SCOPE_KEY,
      resetBehavior: "SEASONAL",
      ownershipScope: "CHARACTER"
    });
  }

  /*
   * The character panel's "All Characters: 18" tooltip breakdown looked
   * like a warband-pooled wallet, but a real live capture on
   * 2026-08-28 showed C_CurrencyInfo.IsAccountWideCurrency(3465)
   * authoritatively returning false - that per-character summary view
   * is informational only, not evidence of a shared pool. The API
   * result is trusted over the UI inference.
   */
  await resourceDefinitionService.ensureDefinition({
    key: "venomblight-manaflux",
    scopeKey: MIDNIGHT_SEASON_2_SCOPE_KEY,
    externalCurrencyId: 3465,
    name: "Venomblight Manaflux",
    category: "CONVERSION",
    resetBehavior: "SEASONAL",
    ownershipScope: "CHARACTER",
    sortOrder: 80
  });
}

/*
 * weeklyQuest ids were corrected 2026-08-28 from a sequential,
 * internally-consistent reference table the user supplied
 * (93690-93714, one contiguous block covering all 11 professions) -
 * see ProfessionWeeklyCatalog.lua. Live acceptance on 2026-08-29
 * across 20 real characters confirmed the corrected weekly-quest ids
 * (captured flaggedCompleted values formed a plausible pattern -
 * mostly true across alts for a fast weekly, rare for the Treatise -
 * and the user confirmed that pattern matches reality) for the 8
 * professions actually present on those characters: alchemy,
 * blacksmithing, enchanting, engineering, inscription, jewelcrafting,
 * leatherworking, tailoring. herbalism/mining/skinning have NO live
 * evidence (no logged-in character has them) and stay disabled per
 * the "leave disabled rather than inventing an id" rule - see the
 * Automatic Profession Weekly audit. Do not enable them without a
 * character that actually holds one of those professions to verify
 * against.
 */
async function seedProfessionWeeklySources() {
  const professionWeeklyDefinitionService =
    new ProfessionWeeklyDefinitionService(
      new ProfessionWeeklyDefinitionRepository()
    );

  const professionQuestIds: Record<
    string,
    { weeklyQuest: number; treatise: number; verified: boolean }
  > = {
    alchemy: { weeklyQuest: 93690, treatise: 95127, verified: true },
    blacksmithing: {
      weeklyQuest: 93691,
      treatise: 95128,
      verified: true
    },
    enchanting: {
      weeklyQuest: 93697,
      treatise: 95129,
      verified: true
    },
    engineering: {
      weeklyQuest: 93692,
      treatise: 95138,
      verified: true
    },
    herbalism: {
      weeklyQuest: 93700,
      treatise: 95130,
      verified: false
    },
    inscription: {
      weeklyQuest: 93693,
      treatise: 95131,
      verified: true
    },
    jewelcrafting: {
      weeklyQuest: 93694,
      treatise: 95133,
      verified: true
    },
    leatherworking: {
      weeklyQuest: 93695,
      treatise: 95134,
      verified: true
    },
    mining: { weeklyQuest: 93705, treatise: 95135, verified: false },
    skinning: {
      weeklyQuest: 93710,
      treatise: 95136,
      verified: false
    },
    tailoring: {
      weeklyQuest: 93696,
      treatise: 95137,
      verified: true
    }
  };

  for (const [professionKey, ids] of Object.entries(
    professionQuestIds
  )) {
    await professionWeeklyDefinitionService.ensureDefinition({
      scopeKey: MIDNIGHT_SEASON_2_SCOPE_KEY,
      professionKey,
      sourceKey: "weekly-quest",
      name: "Weekly Quest",
      sourceType: "WEEKLY_QUEST",
      externalQuestId: ids.weeklyQuest,
      enabled: ids.verified,
      sortOrder: 0
    });

    await professionWeeklyDefinitionService.ensureDefinition({
      scopeKey: MIDNIGHT_SEASON_2_SCOPE_KEY,
      professionKey,
      sourceKey: "treatise",
      name: "Treatise",
      sourceType: "TREATISE",
      externalQuestId: ids.treatise,
      enabled: ids.verified,
      sortOrder: 1
    });
  }

  await seedKnowledgeDropsSources(
    professionWeeklyDefinitionService
  );
}

/*
 * Knowledge Drops evidence ids were cross-checked 2026-08-29 against
 * Myu's Knowledge Points Tracker (github.com/myu-westfall/
 * MyusKnowledgePointsTracker) - each profession has 2-4 independent
 * hidden-quest "slots" (see ProfessionWeeklyCatalog.lua for the full
 * any-one-candidate lists per slot; only the first candidate of each
 * slot is stored here, matching by professionKey+sourceKey not by id).
 * Unlike weeklyQuest/treatise, none of this has been live-verified
 * against a real character yet, so every slot stays disabled - see the
 * "leave disabled rather than inventing an id" rule.
 */
async function seedKnowledgeDropsSources(
  professionWeeklyDefinitionService: ProfessionWeeklyDefinitionService
) {
  const knowledgeDropsSlots: Record<string, number[]> = {
    alchemy: [93528, 93529],
    blacksmithing: [93530, 93531],
    enchanting: [93532, 93533, 95048, 95053],
    engineering: [93534, 93535],
    herbalism: [81425, 81430],
    inscription: [93536, 93537],
    jewelcrafting: [93538, 93539],
    leatherworking: [93540, 93541],
    mining: [88673, 88678],
    skinning: [88534, 88529],
    tailoring: [93542, 93543]
  };

  for (const [professionKey, slots] of Object.entries(
    knowledgeDropsSlots
  )) {
    for (const [slotIndex, questId] of slots.entries()) {
      await professionWeeklyDefinitionService.ensureDefinition({
        scopeKey: MIDNIGHT_SEASON_2_SCOPE_KEY,
        professionKey,
        sourceKey: `knowledge-drops-${slotIndex + 1}`,
        name: "Knowledge Drops",
        sourceType: "KNOWLEDGE_DROPS",
        externalQuestId: questId,
        enabled: false,
        sortOrder: 2 + slotIndex
      });
    }
  }
}

async function seed() {
  await seedProfessions();
  await seedBlacksmithingArmorTree();
  await seedMidnightSeason2Profile();
  await seedMidnightSeason2Resources();
  await seedProfessionWeeklySources();
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });