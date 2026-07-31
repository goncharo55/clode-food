-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- CreateTable
CREATE TABLE "Chain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "officialSiteUrl" TEXT NOT NULL,
    "logoImageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "targetProducts" JSONB NOT NULL,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "extractionMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationAlias" (
    "id" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "StationAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignArea" (
    "campaignId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "CampaignArea_pkey" PRIMARY KEY ("campaignId","areaId")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chain_slug_key" ON "Chain"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_chainId_idx" ON "Campaign"("chainId");

-- CreateIndex
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");

-- CreateIndex
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Area_slug_key" ON "Area"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StationAlias_stationName_key" ON "StationAlias"("stationName");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationAlias" ADD CONSTRAINT "StationAlias_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignArea" ADD CONSTRAINT "CampaignArea_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignArea" ADD CONSTRAINT "CampaignArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
