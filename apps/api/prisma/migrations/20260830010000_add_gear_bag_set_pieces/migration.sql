-- CreateTable
CREATE TABLE "CharacterGearBagSetPiece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "itemId" INTEGER,
    "itemLink" TEXT,
    "setId" INTEGER,
    "expansionId" INTEGER,
    "equipLoc" TEXT,
    "setEvidenceResolved" BOOLEAN,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterGearBagSetPiece_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CharacterGearBagSetPiece_characterId_setId_idx" ON "CharacterGearBagSetPiece"("characterId", "setId");

-- CreateIndex
CREATE INDEX "CharacterGearBagSetPiece_characterId_idx" ON "CharacterGearBagSetPiece"("characterId");
