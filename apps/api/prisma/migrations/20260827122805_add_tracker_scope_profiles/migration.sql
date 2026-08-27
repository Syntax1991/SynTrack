-- CreateTable
CREATE TABLE "TrackerScopeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackerScopeProfile_key_key" ON "TrackerScopeProfile"("key");

-- Seed the initial active profile so this migration can never leave
-- Overview/Character Detail with zero active tracker scopes. This
-- exactly matches the pre-existing hardcoded ACTIVE_TRACKER_SCOPE_KEY
-- constant, so nothing changes behaviorally the moment it lands.
INSERT INTO "TrackerScopeProfile" ("id", "key", "name", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES ('midnight-s1', 'MIDNIGHT-S1', 'Midnight Season 1', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
