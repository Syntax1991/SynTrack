-- CreateTable
CREATE TABLE "SeasonGoalPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalKey" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "numericTarget" INTEGER,
    "enumTarget" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SeasonGoalPreference_characterId_idx" ON "SeasonGoalPreference"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonGoalPreference_goalKey_characterId_key" ON "SeasonGoalPreference"("goalKey", "characterId");
