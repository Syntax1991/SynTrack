-- CreateTable
CREATE TABLE "DeviceLinkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCode" TEXT NOT NULL,
    "deviceCodeHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clientName" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DeviceCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "linkRequestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "DeviceCredential_linkRequestId_fkey" FOREIGN KEY ("linkRequestId") REFERENCES "DeviceLinkRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLinkRequest_userCode_key" ON "DeviceLinkRequest"("userCode");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLinkRequest_deviceCodeHash_key" ON "DeviceLinkRequest"("deviceCodeHash");

-- CreateIndex
CREATE INDEX "DeviceLinkRequest_status_expiresAt_idx" ON "DeviceLinkRequest"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCredential_tokenHash_key" ON "DeviceCredential"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCredential_linkRequestId_key" ON "DeviceCredential"("linkRequestId");

-- CreateIndex
CREATE INDEX "DeviceCredential_revokedAt_idx" ON "DeviceCredential"("revokedAt");
