-- CreateTable
CREATE TABLE "RaidCooldownPlanMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaidCooldownPlanMember_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LootSimReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportUrl" TEXT NOT NULL,
    "publicTitle" TEXT NOT NULL,
    "charClass" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "baselineDps" REAL NOT NULL,
    "upgradesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LootSimReport" ("baselineDps", "charClass", "createdAt", "id", "memberId", "publicTitle", "reportId", "reportUrl", "spec", "updatedAt", "upgradesJson") SELECT "baselineDps", "charClass", "createdAt", "id", "memberId", "publicTitle", "reportId", "reportUrl", "spec", "updatedAt", "upgradesJson" FROM "LootSimReport";
DROP TABLE "LootSimReport";
ALTER TABLE "new_LootSimReport" RENAME TO "LootSimReport";
CREATE UNIQUE INDEX "LootSimReport_memberId_key" ON "LootSimReport"("memberId");
CREATE TABLE "new_LootTierPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "tierSlot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LootTierPreference" ("createdAt", "id", "memberId", "status", "tierSlot", "updatedAt") SELECT "createdAt", "id", "memberId", "status", "tierSlot", "updatedAt" FROM "LootTierPreference";
DROP TABLE "LootTierPreference";
ALTER TABLE "new_LootTierPreference" RENAME TO "LootTierPreference";
CREATE INDEX "LootTierPreference_memberId_idx" ON "LootTierPreference"("memberId");
CREATE UNIQUE INDEX "LootTierPreference_memberId_tierSlot_key" ON "LootTierPreference"("memberId", "tierSlot");
CREATE TABLE "new_LootTrinketChoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LootTrinketChoice" ("createdAt", "id", "itemId", "memberId", "rank", "updatedAt") SELECT "createdAt", "id", "itemId", "memberId", "rank", "updatedAt" FROM "LootTrinketChoice";
DROP TABLE "LootTrinketChoice";
ALTER TABLE "new_LootTrinketChoice" RENAME TO "LootTrinketChoice";
CREATE INDEX "LootTrinketChoice_memberId_idx" ON "LootTrinketChoice"("memberId");
CREATE UNIQUE INDEX "LootTrinketChoice_memberId_rank_key" ON "LootTrinketChoice"("memberId", "rank");
CREATE TABLE "new_RaidBossAbilityCast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
    "abilityIcon" TEXT,
    "timestampSeconds" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaidBossAbilityCast_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaidBossAbilityCast" ("abilityIcon", "abilityName", "bossId", "createdAt", "id", "sortOrder", "timestampSeconds", "updatedAt") SELECT "abilityIcon", "abilityName", "bossId", "createdAt", "id", "sortOrder", "timestampSeconds", "updatedAt" FROM "RaidBossAbilityCast";
DROP TABLE "RaidBossAbilityCast";
ALTER TABLE "new_RaidBossAbilityCast" RENAME TO "RaidBossAbilityCast";
CREATE INDEX "RaidBossAbilityCast_bossId_idx" ON "RaidBossAbilityCast"("bossId");
CREATE TABLE "new_RaidBossPhaseMarker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaidBossPhaseMarker_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaidBossPhaseMarker" ("bossId", "createdAt", "id", "label", "sortOrder", "startSeconds", "updatedAt") SELECT "bossId", "createdAt", "id", "label", "sortOrder", "startSeconds", "updatedAt" FROM "RaidBossPhaseMarker";
DROP TABLE "RaidBossPhaseMarker";
ALTER TABLE "new_RaidBossPhaseMarker" RENAME TO "RaidBossPhaseMarker";
CREATE INDEX "RaidBossPhaseMarker_bossId_idx" ON "RaidBossPhaseMarker"("bossId");
CREATE TABLE "new_RaidCooldownAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
    "spellId" INTEGER,
    "abilityIcon" TEXT,
    "phaseLabel" TEXT,
    "timestampSeconds" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaidCooldownAssignment_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaidCooldownAssignment" ("abilityIcon", "abilityName", "bossId", "createdAt", "id", "memberId", "phaseLabel", "sortOrder", "spellId", "timestampSeconds", "updatedAt") SELECT "abilityIcon", "abilityName", "bossId", "createdAt", "id", "memberId", "phaseLabel", "sortOrder", "spellId", "timestampSeconds", "updatedAt" FROM "RaidCooldownAssignment";
DROP TABLE "RaidCooldownAssignment";
ALTER TABLE "new_RaidCooldownAssignment" RENAME TO "RaidCooldownAssignment";
CREATE INDEX "RaidCooldownAssignment_bossId_idx" ON "RaidCooldownAssignment"("bossId");
CREATE INDEX "RaidCooldownAssignment_memberId_idx" ON "RaidCooldownAssignment"("memberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RaidCooldownPlanMember_bossId_idx" ON "RaidCooldownPlanMember"("bossId");

-- CreateIndex
CREATE INDEX "RaidCooldownPlanMember_memberId_idx" ON "RaidCooldownPlanMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "RaidCooldownPlanMember_bossId_memberId_key" ON "RaidCooldownPlanMember"("bossId", "memberId");

-- RedefineIndex
DROP INDEX "RaidCooldownSetupMember_setupId_memberId_key";
CREATE UNIQUE INDEX "RaidSetupMember_setupId_memberId_key" ON "RaidSetupMember"("setupId", "memberId");

-- RedefineIndex
DROP INDEX "RaidCooldownSetupMember_memberId_idx";
CREATE INDEX "RaidSetupMember_memberId_idx" ON "RaidSetupMember"("memberId");

-- DataMigration: every distinct (bossId, memberId) that already has a
-- real RaidCooldownAssignment becomes a plan member too, so existing
-- demo/dev data (e.g. Thornclad/Grimmshade) keeps rendering as
-- Cooldown Plan participants after this change. No-op on a fresh
-- database with no assignments yet.
INSERT INTO "RaidCooldownPlanMember" ("id", "bossId", "memberId", "sortOrder", "createdAt")
SELECT lower(hex(randomblob(16))), "bossId", "memberId", 0, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "bossId", "memberId" FROM "RaidCooldownAssignment");
