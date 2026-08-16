-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RaidCooldownAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "setupId" TEXT,
    "memberId" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
    "spellId" INTEGER,
    "abilityIcon" TEXT,
    "phaseLabel" TEXT,
    "timestampSeconds" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaidCooldownAssignment_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RaidCooldownAssignment_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "RaidSetup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaidCooldownAssignment" ("abilityIcon", "abilityName", "bossId", "createdAt", "id", "memberId", "phaseLabel", "sortOrder", "spellId", "timestampSeconds", "updatedAt") SELECT "abilityIcon", "abilityName", "bossId", "createdAt", "id", "memberId", "phaseLabel", "sortOrder", "spellId", "timestampSeconds", "updatedAt" FROM "RaidCooldownAssignment";
DROP TABLE "RaidCooldownAssignment";
ALTER TABLE "new_RaidCooldownAssignment" RENAME TO "RaidCooldownAssignment";
CREATE INDEX "RaidCooldownAssignment_bossId_idx" ON "RaidCooldownAssignment"("bossId");
CREATE INDEX "RaidCooldownAssignment_setupId_idx" ON "RaidCooldownAssignment"("setupId");
CREATE INDEX "RaidCooldownAssignment_memberId_idx" ON "RaidCooldownAssignment"("memberId");
CREATE TABLE "new_RaidCooldownPlanMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bossId" TEXT NOT NULL,
    "setupId" TEXT,
    "memberId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaidCooldownPlanMember_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "RaidBoss" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RaidCooldownPlanMember_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "RaidSetup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaidCooldownPlanMember" ("bossId", "createdAt", "id", "memberId", "sortOrder") SELECT "bossId", "createdAt", "id", "memberId", "sortOrder" FROM "RaidCooldownPlanMember";
DROP TABLE "RaidCooldownPlanMember";
ALTER TABLE "new_RaidCooldownPlanMember" RENAME TO "RaidCooldownPlanMember";
CREATE INDEX "RaidCooldownPlanMember_bossId_idx" ON "RaidCooldownPlanMember"("bossId");
CREATE INDEX "RaidCooldownPlanMember_setupId_idx" ON "RaidCooldownPlanMember"("setupId");
CREATE INDEX "RaidCooldownPlanMember_memberId_idx" ON "RaidCooldownPlanMember"("memberId");
CREATE UNIQUE INDEX "RaidCooldownPlanMember_bossId_memberId_key" ON "RaidCooldownPlanMember"("bossId", "memberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
