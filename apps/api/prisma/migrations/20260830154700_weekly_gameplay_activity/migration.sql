-- CreateTable
CREATE TABLE "CharacterWeeklyGameplaySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ADDON',
    "vaultCaptured" BOOLEAN NOT NULL,
    "vaultGenerated" BOOLEAN,
    "vaultCurrentPeriod" BOOLEAN,
    "vaultCanClaim" BOOLEAN,
    "vaultHasAvailable" BOOLEAN,
    "mythicPlusCaptured" BOOLEAN NOT NULL,
    "raidCaptured" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterWeeklyGameplaySnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterWeeklyVaultActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "typeName" TEXT,
    "index" INTEGER,
    "threshold" INTEGER,
    "progress" INTEGER,
    "activityId" INTEGER,
    "level" INTEGER,
    "activityTierId" INTEGER,
    "claimId" INTEGER,
    CONSTRAINT "CharacterWeeklyVaultActivity_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CharacterWeeklyGameplaySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterWeeklyMythicPlusCapture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "mapChallengeModeId" INTEGER,
    "keyLevel" INTEGER NOT NULL,
    "completed" BOOLEAN,
    "thisWeek" BOOLEAN,
    "durationSec" INTEGER,
    "dungeonScore" INTEGER,
    CONSTRAINT "CharacterWeeklyMythicPlusCapture_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CharacterWeeklyGameplaySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterWeeklyRaidLockout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "difficulty" INTEGER,
    "difficultyName" TEXT,
    "encounterProgress" INTEGER,
    "numEncounters" INTEGER,
    "encountersJson" TEXT NOT NULL,
    CONSTRAINT "CharacterWeeklyRaidLockout_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CharacterWeeklyGameplaySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterWeeklyGameplaySnapshot_characterId_periodKey_key" ON "CharacterWeeklyGameplaySnapshot"("characterId", "periodKey");

-- CreateIndex
CREATE INDEX "CharacterWeeklyGameplaySnapshot_periodKey_idx" ON "CharacterWeeklyGameplaySnapshot"("periodKey");

-- CreateIndex
CREATE INDEX "CharacterWeeklyVaultActivity_snapshotId_type_idx" ON "CharacterWeeklyVaultActivity"("snapshotId", "type");

-- CreateIndex
CREATE INDEX "CharacterWeeklyMythicPlusCapture_snapshotId_idx" ON "CharacterWeeklyMythicPlusCapture"("snapshotId");

-- CreateIndex
CREATE INDEX "CharacterWeeklyRaidLockout_snapshotId_idx" ON "CharacterWeeklyRaidLockout"("snapshotId");
