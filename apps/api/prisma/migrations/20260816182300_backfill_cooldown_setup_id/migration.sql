-- DataMigration: every existing RaidCooldownPlanMember/RaidCooldownAssignment
-- row gets associated with its boss's event's current "main" Setup. Today
-- there is exactly one operational Setup per event (RaidSetupRepository
-- always upserts key="main"), so this mapping is deterministic. Repeat-safe:
-- only touches rows where setupId is still NULL, so re-running it (or running
-- it on a database that already has setupId populated) is a no-op.
UPDATE "RaidCooldownPlanMember"
SET "setupId" = (
  SELECT s."id"
  FROM "RaidSetup" s
  JOIN "RaidBoss" b ON b."raidEventId" = s."raidEventId"
  WHERE b."id" = "RaidCooldownPlanMember"."bossId"
    AND s."key" = 'main'
)
WHERE "setupId" IS NULL;

UPDATE "RaidCooldownAssignment"
SET "setupId" = (
  SELECT s."id"
  FROM "RaidSetup" s
  JOIN "RaidBoss" b ON b."raidEventId" = s."raidEventId"
  WHERE b."id" = "RaidCooldownAssignment"."bossId"
    AND s."key" = 'main'
)
WHERE "setupId" IS NULL;
