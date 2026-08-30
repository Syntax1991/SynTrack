-- AlterTable
ALTER TABLE "CharacterGearSlot" ADD COLUMN "setId" INTEGER;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "expansionId" INTEGER;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "setEvidenceResolved" BOOLEAN;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "setBonusResolved" BOOLEAN;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "setBonusSpellIds" TEXT;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "uniqueCategoryId" INTEGER;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "uniqueCategoryCount" INTEGER;
ALTER TABLE "CharacterGearSlot" ADD COLUMN "uniquenessResolved" BOOLEAN;
