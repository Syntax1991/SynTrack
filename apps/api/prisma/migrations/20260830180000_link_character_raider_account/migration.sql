-- SQLite cannot ADD CONSTRAINT via ALTER TABLE; rebuild Character with owner FK.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleNetId" TEXT,
    "name" TEXT NOT NULL,
    "realm" TEXT NOT NULL,
    "realmSlug" TEXT,
    "region" TEXT NOT NULL DEFAULT 'eu',
    "className" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 80,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "lastSyncedAt" DATETIME,
    "raiderAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_raiderAccountId_fkey" FOREIGN KEY ("raiderAccountId") REFERENCES "RaiderAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("id", "battleNetId", "name", "realm", "realmSlug", "region", "className", "level", "source", "lastSyncedAt", "createdAt", "updatedAt")
SELECT "id", "battleNetId", "name", "realm", "realmSlug", "region", "className", "level", "source", "lastSyncedAt", "createdAt", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_realm_region_key" ON "Character"("name", "realm", "region");
CREATE INDEX "Character_battleNetId_region_idx" ON "Character"("battleNetId", "region");
CREATE INDEX "Character_source_idx" ON "Character"("source");
CREATE INDEX "Character_raiderAccountId_idx" ON "Character"("raiderAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
