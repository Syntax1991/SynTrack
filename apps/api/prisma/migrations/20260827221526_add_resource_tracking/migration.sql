-- CreateTable
CREATE TABLE "ResourceDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "externalCurrencyId" INTEGER,
    "externalItemId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "resetBehavior" TEXT NOT NULL,
    "ownershipScope" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterResourceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "resourceDefinitionId" TEXT NOT NULL,
    "quantity" INTEGER,
    "maxQuantity" INTEGER,
    "weeklyQuantity" INTEGER,
    "maxWeeklyQuantity" INTEGER,
    "isCapped" BOOLEAN,
    "isWeeklyCapped" BOOLEAN,
    "discovered" BOOLEAN,
    "accountWide" BOOLEAN,
    "source" TEXT NOT NULL DEFAULT 'ADDON',
    "capturedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterResourceSnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterResourceSnapshot_resourceDefinitionId_fkey" FOREIGN KEY ("resourceDefinitionId") REFERENCES "ResourceDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDefinition_key_key" ON "ResourceDefinition"("key");

-- CreateIndex
CREATE INDEX "ResourceDefinition_scopeKey_idx" ON "ResourceDefinition"("scopeKey");

-- CreateIndex
CREATE INDEX "ResourceDefinition_enabled_idx" ON "ResourceDefinition"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDefinition_scopeKey_externalCurrencyId_key" ON "ResourceDefinition"("scopeKey", "externalCurrencyId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDefinition_scopeKey_externalItemId_key" ON "ResourceDefinition"("scopeKey", "externalItemId");

-- CreateIndex
CREATE INDEX "CharacterResourceSnapshot_resourceDefinitionId_idx" ON "CharacterResourceSnapshot"("resourceDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterResourceSnapshot_characterId_resourceDefinitionId_key" ON "CharacterResourceSnapshot"("characterId", "resourceDefinitionId");
