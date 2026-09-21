-- AlterTable
ALTER TABLE "RaiderAccount" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL';

-- Existing accounts must remain usable; new inserts keep the pending default.
UPDATE "RaiderAccount" SET "status" = 'ACTIVE';
