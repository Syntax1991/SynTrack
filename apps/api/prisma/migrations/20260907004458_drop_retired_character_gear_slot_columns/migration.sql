-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CharacterGearSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "itemId" INTEGER,
    "itemName" TEXT,
    "itemLevel" INTEGER,
    "enchantStatus" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    "enchantName" TEXT,
    "socketCount" INTEGER,
    "gemCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "lastSyncedAt" DATETIME,
    "setId" INTEGER,
    "expansionId" INTEGER,
    "setEvidenceResolved" BOOLEAN,
    "setBonusResolved" BOOLEAN,
    "setBonusSpellIds" TEXT,
    "uniqueCategoryId" INTEGER,
    "uniquenessResolved" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterGearSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CharacterGearSlot" ("characterId", "createdAt", "enchantName", "enchantStatus", "expansionId", "gemCount", "id", "itemId", "itemLevel", "itemName", "lastSyncedAt", "notes", "setBonusResolved", "setBonusSpellIds", "setEvidenceResolved", "setId", "slotKey", "socketCount", "source", "uniqueCategoryId", "uniquenessResolved", "updatedAt") SELECT "characterId", "createdAt", "enchantName", "enchantStatus", "expansionId", "gemCount", "id", "itemId", "itemLevel", "itemName", "lastSyncedAt", "notes", "setBonusResolved", "setBonusSpellIds", "setEvidenceResolved", "setId", "slotKey", "socketCount", "source", "uniqueCategoryId", "uniquenessResolved", "updatedAt" FROM "CharacterGearSlot";
DROP TABLE "CharacterGearSlot";
ALTER TABLE "new_CharacterGearSlot" RENAME TO "CharacterGearSlot";
CREATE INDEX "CharacterGearSlot_slotKey_idx" ON "CharacterGearSlot"("slotKey");
CREATE INDEX "CharacterGearSlot_source_idx" ON "CharacterGearSlot"("source");
CREATE UNIQUE INDEX "CharacterGearSlot_characterId_slotKey_key" ON "CharacterGearSlot"("characterId", "slotKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

