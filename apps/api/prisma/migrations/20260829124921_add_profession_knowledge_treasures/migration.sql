-- CreateTable
CREATE TABLE "ProfessionKnowledgeTreasureDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeKey" TEXT NOT NULL,
    "professionKey" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalQuestId" INTEGER NOT NULL,
    "knowledgePoints" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterProfessionKnowledgeTreasureSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "flaggedCompleted" BOOLEAN,
    "externalQuestId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'ADDON',
    "capturedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterProfessionKnowledgeTreasureSnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterProfessionKnowledgeTreasureSnapshot_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ProfessionKnowledgeTreasureDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfessionKnowledgeTreasureDefinition_scopeKey_idx" ON "ProfessionKnowledgeTreasureDefinition"("scopeKey");

-- CreateIndex
CREATE INDEX "ProfessionKnowledgeTreasureDefinition_enabled_idx" ON "ProfessionKnowledgeTreasureDefinition"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionKnowledgeTreasureDefinition_scopeKey_professionKey_sourceKey_key" ON "ProfessionKnowledgeTreasureDefinition"("scopeKey", "professionKey", "sourceKey");

-- CreateIndex
CREATE INDEX "CharacterProfessionKnowledgeTreasureSnapshot_definitionId_idx" ON "CharacterProfessionKnowledgeTreasureSnapshot"("definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProfessionKnowledgeTreasureSnapshot_characterId_definitionId_key" ON "CharacterProfessionKnowledgeTreasureSnapshot"("characterId", "definitionId");
