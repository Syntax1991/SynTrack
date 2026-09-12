-- CreateTable
CREATE TABLE "CharacterExternalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "payloadJson" TEXT,
    "fetchedAt" DATETIME,
    "lastAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStatus" TEXT NOT NULL,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterExternalSnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CharacterExternalSnapshot_characterId_idx" ON "CharacterExternalSnapshot"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterExternalSnapshot_characterId_source_domain_key" ON "CharacterExternalSnapshot"("characterId", "source", "domain");
