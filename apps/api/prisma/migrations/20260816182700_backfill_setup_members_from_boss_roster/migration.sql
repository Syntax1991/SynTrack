-- DataMigration: RaidSetupMember has been empty since it was introduced
-- (see 20260815240000_raid_setup_structural_refactor's own comment: "table
-- is still empty, never consumed by application code yet") even though
-- RaidBossRosterEntry rows already exist and are correctly setupId-scoped.
-- Deterministically populate each Setup's member pool from the memberIds
-- already present in ITS OWN RaidBossRosterEntry rows — never the full
-- guild roster, never an invented member. Only touches a Setup that
-- currently has zero RaidSetupMember rows, so this is repeat-safe and
-- never overwrites a pool an officer has already curated through the app.
INSERT INTO "RaidSetupMember" ("id", "setupId", "memberId", "createdAt")
SELECT
  lower(hex(randomblob(16))),
  pooled."setupId",
  pooled."memberId",
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT rbre."setupId" AS "setupId", rbre."memberId" AS "memberId"
  FROM "RaidBossRosterEntry" rbre
  WHERE NOT EXISTS (
    SELECT 1 FROM "RaidSetupMember" sm WHERE sm."setupId" = rbre."setupId"
  )
) AS pooled;
