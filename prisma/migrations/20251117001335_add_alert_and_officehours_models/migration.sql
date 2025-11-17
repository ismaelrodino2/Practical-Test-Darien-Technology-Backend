-- CreateTable
CREATE TABLE "office_hours" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "office_hours_officeId_key" ON "office_hours"("officeId");

-- CreateIndex
CREATE INDEX "office_hours_officeId_idx" ON "office_hours"("officeId");

-- CreateIndex
CREATE INDEX "alerts_officeId_idx" ON "alerts"("officeId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_kind_idx" ON "alerts"("kind");

-- CreateIndex
CREATE INDEX "alerts_officeId_kind_status_idx" ON "alerts"("officeId", "kind", "status");
