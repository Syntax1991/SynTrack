-- AlterTable
ALTER TABLE "CraftRecipe" ADD COLUMN "iconUrl" TEXT;

-- AlterTable
ALTER TABLE "ProfessionSpecializationNode" ADD COLUMN "iconUrl" TEXT;
ALTER TABLE "ProfessionSpecializationNode" ADD COLUMN "spellId" INTEGER;
