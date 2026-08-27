-- CreateTable
CREATE TABLE "CharacterTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterTagAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterTagAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CharacterTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTag_name_key" ON "CharacterTag"("name");

-- CreateIndex
CREATE INDEX "CharacterTagAssignment_tagId_idx" ON "CharacterTagAssignment"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTagAssignment_characterId_tagId_key" ON "CharacterTagAssignment"("characterId", "tagId");
