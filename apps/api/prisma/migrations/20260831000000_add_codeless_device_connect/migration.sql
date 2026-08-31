-- AlterTable
ALTER TABLE "BattleNetOAuthState" ADD COLUMN "deviceLinkRequestId" TEXT;

-- AlterTable
ALTER TABLE "RaiderPendingRegistration" ADD COLUMN "deviceLinkRequestId" TEXT;
ALTER TABLE "RaiderPendingRegistration" ADD COLUMN "returnTo" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeviceLinkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCode" TEXT,
    "deviceCodeHash" TEXT NOT NULL,
    "browserTokenHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clientName" TEXT,
    "raiderAccountId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DeviceLinkRequest" ("id", "userCode", "deviceCodeHash", "status", "clientName", "expiresAt", "approvedAt", "consumedAt", "createdAt") SELECT "id", "userCode", "deviceCodeHash", "status", "clientName", "expiresAt", "approvedAt", "consumedAt", "createdAt" FROM "DeviceLinkRequest";
DROP TABLE "DeviceLinkRequest";
ALTER TABLE "new_DeviceLinkRequest" RENAME TO "DeviceLinkRequest";
CREATE UNIQUE INDEX "DeviceLinkRequest_userCode_key" ON "DeviceLinkRequest"("userCode");
CREATE UNIQUE INDEX "DeviceLinkRequest_deviceCodeHash_key" ON "DeviceLinkRequest"("deviceCodeHash");
CREATE UNIQUE INDEX "DeviceLinkRequest_browserTokenHash_key" ON "DeviceLinkRequest"("browserTokenHash");
CREATE INDEX "DeviceLinkRequest_status_expiresAt_idx" ON "DeviceLinkRequest"("status", "expiresAt");
CREATE INDEX "DeviceLinkRequest_raiderAccountId_idx" ON "DeviceLinkRequest"("raiderAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
