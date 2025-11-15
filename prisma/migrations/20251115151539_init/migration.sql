-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "locationId" TEXT,
    "clientEmail" TEXT NOT NULL,
    "reservationAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_coordinates_key" ON "locations"("name", "coordinates");

-- CreateIndex
CREATE INDEX "spaces_locationId_idx" ON "spaces"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_locationId_name_key" ON "spaces"("locationId", "name");

-- CreateIndex
CREATE INDEX "reservations_spaceId_idx" ON "reservations"("spaceId");

-- CreateIndex
CREATE INDEX "reservations_locationId_idx" ON "reservations"("locationId");

-- CreateIndex
CREATE INDEX "reservations_clientEmail_idx" ON "reservations"("clientEmail");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
