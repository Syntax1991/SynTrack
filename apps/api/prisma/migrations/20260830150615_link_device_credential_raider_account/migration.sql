-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeviceCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "linkRequestId" TEXT,
    "raiderAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "DeviceCredential_linkRequestId_fkey" FOREIGN KEY ("linkRequestId") REFERENCES "DeviceLinkRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeviceCredential_raiderAccountId_fkey" FOREIGN KEY ("raiderAccountId") REFERENCES "RaiderAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeviceCredential" ("createdAt", "id", "lastSeenAt", "linkRequestId", "name", "revokedAt", "tokenHash") SELECT "createdAt", "id", "lastSeenAt", "linkRequestId", "name", "revokedAt", "tokenHash" FROM "DeviceCredential";
DROP TABLE "DeviceCredential";
ALTER TABLE "new_DeviceCredential" RENAME TO "DeviceCredential";
CREATE UNIQUE INDEX "DeviceCredential_tokenHash_key" ON "DeviceCredential"("tokenHash");
CREATE UNIQUE INDEX "DeviceCredential_linkRequestId_key" ON "DeviceCredential"("linkRequestId");
CREATE INDEX "DeviceCredential_revokedAt_idx" ON "DeviceCredential"("revokedAt");
CREATE INDEX "DeviceCredential_raiderAccountId_idx" ON "DeviceCredential"("raiderAccountId");
CREATE TABLE "new_DeviceLinkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCode" TEXT NOT NULL,
    "deviceCodeHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clientName" TEXT,
    "raiderAccountId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceLinkRequest_raiderAccountId_fkey" FOREIGN KEY ("raiderAccountId") REFERENCES "RaiderAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeviceLinkRequest" ("approvedAt", "clientName", "consumedAt", "createdAt", "deviceCodeHash", "expiresAt", "id", "status", "userCode") SELECT "approvedAt", "clientName", "consumedAt", "createdAt", "deviceCodeHash", "expiresAt", "id", "status", "userCode" FROM "DeviceLinkRequest";
DROP TABLE "DeviceLinkRequest";
ALTER TABLE "new_DeviceLinkRequest" RENAME TO "DeviceLinkRequest";
CREATE UNIQUE INDEX "DeviceLinkRequest_userCode_key" ON "DeviceLinkRequest"("userCode");
CREATE UNIQUE INDEX "DeviceLinkRequest_deviceCodeHash_key" ON "DeviceLinkRequest"("deviceCodeHash");
CREATE INDEX "DeviceLinkRequest_status_expiresAt_idx" ON "DeviceLinkRequest"("status", "expiresAt");
CREATE INDEX "DeviceLinkRequest_raiderAccountId_idx" ON "DeviceLinkRequest"("raiderAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
