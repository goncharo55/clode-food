-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "targetProducts" JSONB NOT NULL,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "extractionMetadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("chainId", "createdAt", "description", "endDate", "extractionMetadata", "featured", "id", "imageUrl", "sourceUrl", "startDate", "status", "targetProducts", "title", "updatedAt") SELECT "chainId", "createdAt", "description", "endDate", "extractionMetadata", "featured", "id", "imageUrl", "sourceUrl", "startDate", "status", "targetProducts", "title", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_chainId_idx" ON "Campaign"("chainId");
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");
CREATE TABLE "new_Chain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "officialSiteUrl" TEXT NOT NULL,
    "logoImageUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Chain" ("createdAt", "description", "id", "logoImageUrl", "name", "officialSiteUrl", "slug", "updatedAt") SELECT "createdAt", "description", "id", "logoImageUrl", "name", "officialSiteUrl", "slug", "updatedAt" FROM "Chain";
DROP TABLE "Chain";
ALTER TABLE "new_Chain" RENAME TO "Chain";
CREATE UNIQUE INDEX "Chain_slug_key" ON "Chain"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
