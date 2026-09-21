-- CreateTable
CREATE TABLE "CrafterShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raiderAccountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrafterShare_raiderAccountId_fkey" FOREIGN KEY ("raiderAccountId") REFERENCES "RaiderAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrafterShare_raiderAccountId_key" ON "CrafterShare"("raiderAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "CrafterShare_token_key" ON "CrafterShare"("token");

-- CreateIndex
CREATE INDEX "CrafterShare_token_enabled_idx" ON "CrafterShare"("token", "enabled");
