-- CreateTable
CREATE TABLE "device_desired" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "samplingIntervalSec" INTEGER NOT NULL,
    "co2_alert_threshold" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_desired_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_reported" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "samplingIntervalSec" INTEGER,
    "co2_alert_threshold" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_reported_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_desired_officeId_key" ON "device_desired"("officeId");

-- CreateIndex
CREATE INDEX "device_desired_officeId_idx" ON "device_desired"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "device_reported_officeId_key" ON "device_reported"("officeId");

-- CreateIndex
CREATE INDEX "device_reported_officeId_idx" ON "device_reported"("officeId");

