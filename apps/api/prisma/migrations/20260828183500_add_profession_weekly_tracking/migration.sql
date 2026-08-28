-- CreateTable
CREATE TABLE "ProfessionWeeklySourceDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeKey" TEXT NOT NULL,
    "professionKey" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "externalQuestId" INTEGER,
    "externalCurrencyId" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterProfessionWeeklySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "sourceDefinitionId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "flaggedCompleted" BOOLEAN,
    "externalQuestId" INTEGER,
    "currentValue" INTEGER,
    "maxValue" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'ADDON',
    "capturedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterProfessionWeeklySnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterProfessionWeeklySnapshot_sourceDefinitionId_fkey" FOREIGN KEY ("sourceDefinitionId") REFERENCES "ProfessionWeeklySourceDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfessionWeeklySourceDefinition_scopeKey_idx" ON "ProfessionWeeklySourceDefinition"("scopeKey");

-- CreateIndex
CREATE INDEX "ProfessionWeeklySourceDefinition_enabled_idx" ON "ProfessionWeeklySourceDefinition"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionWeeklySourceDefinition_scopeKey_professionKey_sourceKey_key" ON "ProfessionWeeklySourceDefinition"("scopeKey", "professionKey", "sourceKey");

-- CreateIndex
CREATE INDEX "CharacterProfessionWeeklySnapshot_sourceDefinitionId_idx" ON "CharacterProfessionWeeklySnapshot"("sourceDefinitionId");

-- CreateIndex
CREATE INDEX "CharacterProfessionWeeklySnapshot_periodKey_idx" ON "CharacterProfessionWeeklySnapshot"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProfessionWeeklySnapshot_characterId_sourceDefinitionId_periodKey_key" ON "CharacterProfessionWeeklySnapshot"("characterId", "sourceDefinitionId", "periodKey");
