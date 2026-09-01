-- CreateTable
CREATE TABLE "RemovedCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raiderAccountId" TEXT NOT NULL,
    "stableCharacterKey" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "realmName" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'eu',
    "battleNetId" TEXT,
    "removedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RemovedCharacter_raiderAccountId_fkey" FOREIGN KEY ("raiderAccountId") REFERENCES "RaiderAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RemovedCharacter_raiderAccountId_stableCharacterKey_key" ON "RemovedCharacter"("raiderAccountId", "stableCharacterKey");

-- CreateIndex
CREATE INDEX "RemovedCharacter_raiderAccountId_battleNetId_idx" ON "RemovedCharacter"("raiderAccountId", "battleNetId");
