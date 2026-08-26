-- CreateTable
CREATE TABLE "CharacterTrackerDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeKey" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valueType" TEXT NOT NULL,
    "resetBehavior" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterTrackerValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackerDefinitionId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "booleanValue" BOOLEAN,
    "progressCurrent" INTEGER,
    "progressTotal" INTEGER,
    "numberValue" INTEGER,
    "textValue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterTrackerValue_trackerDefinitionId_fkey" FOREIGN KEY ("trackerDefinitionId") REFERENCES "CharacterTrackerDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterTrackerValue_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CharacterTrackerDefinition_scopeKey_idx" ON "CharacterTrackerDefinition"("scopeKey");

-- CreateIndex
CREATE INDEX "CharacterTrackerDefinition_enabled_isPinned_idx" ON "CharacterTrackerDefinition"("enabled", "isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTrackerDefinition_scopeKey_key_key" ON "CharacterTrackerDefinition"("scopeKey", "key");

-- CreateIndex
CREATE INDEX "CharacterTrackerValue_characterId_idx" ON "CharacterTrackerValue"("characterId");

-- CreateIndex
CREATE INDEX "CharacterTrackerValue_periodKey_idx" ON "CharacterTrackerValue"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTrackerValue_trackerDefinitionId_characterId_periodKey_key" ON "CharacterTrackerValue"("trackerDefinitionId", "characterId", "periodKey");
