-- AlterTable
ALTER TABLE "BattleNetOAuthState" ADD COLUMN "intent" TEXT NOT NULL DEFAULT 'login';
ALTER TABLE "BattleNetOAuthState" ADD COLUMN "returnTo" TEXT;

-- AlterTable
ALTER TABLE "RaiderAccount" ADD COLUMN "battleNetAccountId" TEXT;

-- DropIndex
DROP INDEX "RaiderAccount_battleTag_key";

-- CreateIndex
CREATE UNIQUE INDEX "RaiderAccount_battleNetAccountId_key" ON "RaiderAccount"("battleNetAccountId");

-- CreateIndex
CREATE INDEX "RaiderAccount_battleTag_idx" ON "RaiderAccount"("battleTag");

-- CreateTable
CREATE TABLE "RaiderPendingRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleNetAccountId" TEXT NOT NULL,
    "battleTag" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT,
    "tokenExpiresAt" DATETIME NOT NULL,
    "charactersJson" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "RaiderPendingRegistration_expiresAt_idx" ON "RaiderPendingRegistration"("expiresAt");
