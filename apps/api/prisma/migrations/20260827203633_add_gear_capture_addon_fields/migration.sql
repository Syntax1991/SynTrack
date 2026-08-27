-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CharacterGearSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "itemId" INTEGER,
    "itemLink" TEXT,
    "itemName" TEXT,
    "itemLevel" INTEGER,
    "quality" INTEGER,
    "enchantStatus" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    "enchantName" TEXT,
    "enchantId" INTEGER,
    "socketCount" INTEGER,
    "gemCount" INTEGER NOT NULL DEFAULT 0,
    "gemIds" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterGearSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CharacterGearSlot" ("characterId", "createdAt", "enchantName", "enchantStatus", "gemCount", "id", "itemLevel", "itemName", "lastSyncedAt", "notes", "slotKey", "socketCount", "source", "updatedAt") SELECT "characterId", "createdAt", "enchantName", "enchantStatus", "gemCount", "id", "itemLevel", "itemName", "lastSyncedAt", "notes", "slotKey", "socketCount", "source", "updatedAt" FROM "CharacterGearSlot";
DROP TABLE "CharacterGearSlot";
ALTER TABLE "new_CharacterGearSlot" RENAME TO "CharacterGearSlot";
CREATE INDEX "CharacterGearSlot_slotKey_idx" ON "CharacterGearSlot"("slotKey");
CREATE INDEX "CharacterGearSlot_source_idx" ON "CharacterGearSlot"("source");
CREATE UNIQUE INDEX "CharacterGearSlot_characterId_slotKey_key" ON "CharacterGearSlot"("characterId", "slotKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
