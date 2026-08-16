-- AlterTable
-- Nullable, additive: existing rows become UNKNOWN spec (NULL), never
-- guessed from class. An officer explicitly selects a spec per
-- Setup+Boss composition entry going forward.
ALTER TABLE "RaidBossRosterEntry" ADD COLUMN "specId" INTEGER;
