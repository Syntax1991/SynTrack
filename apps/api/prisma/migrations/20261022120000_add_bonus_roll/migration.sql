-- CreateTable
CREATE TABLE "BonusRoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "instanceName" TEXT NOT NULL,
    "encounterId" INTEGER NOT NULL,
    "encounterName" TEXT NOT NULL,
    "targetItemId" INTEGER,
    "targetItemName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "outcome" TEXT,
    "receivedItemId" INTEGER,
    "receivedItemName" TEXT,
    "note" TEXT,
    "rolledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BonusRoll_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BonusRoll_characterId_idx" ON "BonusRoll"("characterId");

-- CreateIndex
CREATE INDEX "BonusRoll_status_idx" ON "BonusRoll"("status");
