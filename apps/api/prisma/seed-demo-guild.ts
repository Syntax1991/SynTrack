import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url:
    process.env.DATABASE_URL ??
    "file:./prisma/dev.db"
});

const prisma = new PrismaClient({
  adapter
});

/**
 * Deliberately not a real Blizzard realm slug. Guild Audit's
 * "Refresh from Blizzard" iterates every roster member and looks up
 * live equipment by name+realm - on a real, populated realm (Draenor
 * was tried first) a fabricated demo name can coincidentally match
 * an unrelated real player and silently overwrite the demo stats
 * with that stranger's actual gear. This realm name can never
 * resolve to a real character, so refresh always 404s and skips
 * these members, leaving the seeded stats stable.
 */
const REALM = "Draenor (Demo)";
const REGION = "eu";

type DemoMember = {
  name: string;
  className: string;
  role: "TANK" | "HEALER" | "MELEE" | "RANGED";
  rank: string;
  rankIndex: number;
  averageItemLevel: number;
  missingEnchantSlots: number;
  totalSocketCount: number;
  filledSocketCount: number;
};

const demoMembers: DemoMember[] = [
  { name: "Thornclad", className: "Warrior", role: "TANK", rank: "Guild Master", rankIndex: 0, averageItemLevel: 308, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Duskbane", className: "Death Knight", role: "TANK", rank: "Officer", rankIndex: 1, averageItemLevel: 302, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Selunari", className: "Priest", role: "HEALER", rank: "Officer", rankIndex: 1, averageItemLevel: 305, missingEnchantSlots: 1, totalSocketCount: 3, filledSocketCount: 2 },
  { name: "Emberholt", className: "Paladin", role: "HEALER", rank: "Officer", rankIndex: 2, averageItemLevel: 298, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Thistledown", className: "Monk", role: "HEALER", rank: "Member", rankIndex: 5, averageItemLevel: 295, missingEnchantSlots: 2, totalSocketCount: 3, filledSocketCount: 1 },
  { name: "Vaelthorn", className: "Mage", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 300, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Grimmshade", className: "Warlock", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 292, missingEnchantSlots: 1, totalSocketCount: 3, filledSocketCount: 2 },
  { name: "Windshear", className: "Hunter", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 296, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Stormcaller", className: "Shaman", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 289, missingEnchantSlots: 3, totalSocketCount: 3, filledSocketCount: 0 },
  { name: "Skywarden", className: "Evoker", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 303, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Sunflare", className: "Priest", role: "RANGED", rank: "Member", rankIndex: 5, averageItemLevel: 291, missingEnchantSlots: 1, totalSocketCount: 3, filledSocketCount: 2 },
  { name: "Nightspire", className: "Rogue", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 299, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Ashenclaw", className: "Druid", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 293, missingEnchantSlots: 1, totalSocketCount: 3, filledSocketCount: 2 },
  { name: "Felbrand", className: "Demon Hunter", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 297, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Ironpelt", className: "Druid", role: "TANK", rank: "Member", rankIndex: 5, averageItemLevel: 294, missingEnchantSlots: 0, totalSocketCount: 3, filledSocketCount: 3 },
  { name: "Brightvow", className: "Paladin", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 288, missingEnchantSlots: 2, totalSocketCount: 3, filledSocketCount: 1 },
  { name: "Mournblade", className: "Warrior", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 290, missingEnchantSlots: 1, totalSocketCount: 3, filledSocketCount: 2 },
  { name: "Coldveil", className: "Death Knight", role: "MELEE", rank: "Member", rankIndex: 5, averageItemLevel: 286, missingEnchantSlots: 2, totalSocketCount: 3, filledSocketCount: 1 }
];

async function seedMembers() {
  const members = [];

  for (const demo of demoMembers) {
    const member = await prisma.guildMember.upsert({
      where: {
        name_realm_region: {
          name: demo.name,
          realm: REALM,
          region: REGION
        }
      },
      create: {
        name: demo.name,
        realm: REALM,
        region: REGION,
        className: demo.className,
        level: 80,
        rank: demo.rank,
        rankIndex: demo.rankIndex,
        role: demo.role,
        source: "MANUAL",
        averageItemLevel: demo.averageItemLevel,
        missingEnchantSlots: demo.missingEnchantSlots,
        totalSocketCount: demo.totalSocketCount,
        filledSocketCount: demo.filledSocketCount,
        auditedAt: new Date()
      },
      update: {
        className: demo.className,
        rank: demo.rank,
        rankIndex: demo.rankIndex,
        role: demo.role,
        averageItemLevel: demo.averageItemLevel,
        missingEnchantSlots: demo.missingEnchantSlots,
        totalSocketCount: demo.totalSocketCount,
        filledSocketCount: demo.filledSocketCount,
        auditedAt: new Date()
      }
    });

    members.push(member);
  }

  return members;
}

async function seedTeam(members: { id: string; name: string }[]) {
  const team = await prisma.guildTeam.upsert({
    where: { name: "Team Main" },
    create: {
      name: "Team Main",
      description: "The guild's primary Mythic progression roster.",
      color: "#8058dd",
      sortOrder: 0
    },
    update: {}
  });

  for (const member of members) {
    await prisma.guildTeamMembership.upsert({
      where: {
        teamId_memberId: {
          teamId: team.id,
          memberId: member.id
        }
      },
      create: {
        teamId: team.id,
        memberId: member.id,
        role: member.name === "Thornclad" ? "LEAD" : "MEMBER"
      },
      update: {}
    });
  }

  return team;
}

async function seedRequirements() {
  const requirements: Array<{
    title: string;
    description: string;
    category: "GEAR" | "ATTENDANCE" | "OTHER";
    minimumItemLevel: number | null;
    sortOrder: number;
  }> = [
    {
      title: "Minimum item level 290",
      description: "Raiders must keep their equipped item level above 290 for current-tier content.",
      category: "GEAR",
      minimumItemLevel: 290,
      sortOrder: 0
    },
    {
      title: "Fully enchanted and gemmed",
      description: "All eligible slots must carry an enchant, and available sockets should be filled.",
      category: "GEAR",
      minimumItemLevel: null,
      sortOrder: 1
    },
    {
      title: "Sign up by Thursday",
      description: "Confirm your signup status for the weekend raid nights before Thursday reset.",
      category: "ATTENDANCE",
      minimumItemLevel: null,
      sortOrder: 2
    }
  ];

  for (const requirement of requirements) {
    const existing = await prisma.guildRequirement.findFirst({
      where: { title: requirement.title }
    });

    if (existing) {
      continue;
    }

    await prisma.guildRequirement.create({
      data: requirement
    });
  }
}

async function seedOfficerNotes(members: { id: string; name: string }[]) {
  const stormcaller = members.find((member) => member.name === "Stormcaller");
  const brightvow = members.find((member) => member.name === "Brightvow");

  if (stormcaller) {
    const existing = await prisma.guildOfficerNote.findFirst({
      where: { memberId: stormcaller.id }
    });

    if (!existing) {
      await prisma.guildOfficerNote.create({
        data: {
          memberId: stormcaller.id,
          authorCharacter: "Thornclad",
          body: "Working on trinket upgrades, missing two enchants — follow up next reset."
        }
      });
    }
  }

  if (brightvow) {
    const existing = await prisma.guildOfficerNote.findFirst({
      where: { memberId: brightvow.id }
    });

    if (!existing) {
      await prisma.guildOfficerNote.create({
        data: {
          memberId: brightvow.id,
          authorCharacter: "Thornclad",
          body: "Reliable trial performance, ready to move to full member after two more clears."
        }
      });
    }
  }
}

async function seed() {
  const members = await seedMembers();
  const team = await seedTeam(members);
  await seedRequirements();
  await seedOfficerNotes(members);

  console.log(
    `Seeded demo guild data: ${members.length} members, team "${team.name}".`
  );
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
