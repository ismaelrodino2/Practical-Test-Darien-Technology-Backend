/*
  Warnings:

  - A unique constraint covering the columns `[siteExternalId]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[officeExternalId]` on the table `spaces` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `siteExternalId` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officeExternalId` to the `spaces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "device_desired" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "device_reported" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "siteExternalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "officeExternalId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "locations_siteExternalId_key" ON "locations"("siteExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_officeExternalId_key" ON "spaces"("officeExternalId");
