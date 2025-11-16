import request from "supertest";
import app from "../../app";
import prisma from "../../config/prismaClient";

/**
 * E2E Tests for Reservations
 * 
 * These tests follow the Prisma documentation pattern:
 * https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing
 * 
 * Prerequisites:
 * - Docker and Docker Compose installed
 * - Run: npm run test:e2e:setup (or docker compose -f docker-compose.test.yml up -d)
 * 
 * Tests are executed against an isolated PostgreSQL database in Docker.
 */

describe("Reservation E2E Tests", () => {
  const apiKey = process.env.API_KEY || "test-api-key";

  beforeAll(async () => {
    // Clean database before all tests
    // Order matters due to relations (reservations -> spaces -> locations)
    const deleteReservations = prisma.reservation.deleteMany();
    const deleteSpaces = prisma.space.deleteMany();
    const deleteLocations = prisma.location.deleteMany();

    await prisma.$transaction([
      deleteReservations,
      deleteSpaces,
      deleteLocations,
    ]);

    console.log("✨ Database cleaned before tests");
  });

  afterAll(async () => {
    // Clean database after all tests
    // Uses transaction to ensure correct order
    const deleteReservations = prisma.reservation.deleteMany();
    const deleteSpaces = prisma.space.deleteMany();
    const deleteLocations = prisma.location.deleteMany();

    await prisma.$transaction([
      deleteReservations,
      deleteSpaces,
      deleteLocations,
    ]);

    await prisma.$disconnect();
    console.log("✨ Database cleaned after tests");
  });

  it("should complete full reservation flow: create Location → create Space → create Reservation → list reservations", async () => {
    let locationId: string;
    let spaceId: string;
    let reservationId: string;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const locationData = {
      name: "E2E Test Location",
      coordinates: "40.7128,-74.0060",
    };

    const spaceData = {
      name: "E2E Test Space",
      capacity: 15,
      description: "E2E test space description",
    };

    const reservationData = {
      clientEmail: "e2e-test@example.com",
      reservationAt: futureDate.toISOString(),
      startsAt: new Date(futureDate.getTime() + 3600000).toISOString(),
      endsAt: new Date(futureDate.getTime() + 7200000).toISOString(),
    };

    // Step 1: Create Location (using Prisma directly since there's no POST endpoint)
    const location = await prisma.location.create({
      data: locationData,
    });

    expect(location).toHaveProperty("id");
    expect(location.name).toBe(locationData.name);
    expect(location.coordinates).toBe(locationData.coordinates);
    locationId = location.id;

    // Verify location exists in database
    const locationInDb = await prisma.location.findUnique({
      where: { id: locationId },
    });
    expect(locationInDb).not.toBeNull();
    expect(locationInDb?.name).toBe(locationData.name);

    // Step 2: Create Space via API
    const spaceResponse = await request(app)
      .post("/api/spaces")
      .set("x-api-key", apiKey)
      .send({
        ...spaceData,
        locationId: locationId,
      });

    expect(spaceResponse.status).toBe(201);
    expect(spaceResponse.body).toHaveProperty("id");
    expect(spaceResponse.body.name).toBe(spaceData.name);
    expect(spaceResponse.body.capacity).toBe(spaceData.capacity);
    expect(spaceResponse.body.locationId).toBe(locationId);
    spaceId = spaceResponse.body.id;

    // Verify space exists in database
    const spaceInDb = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { location: true },
    });
    expect(spaceInDb).not.toBeNull();
    expect(spaceInDb?.name).toBe(spaceData.name);
    expect(spaceInDb?.location.id).toBe(locationId);

    // Step 3: Create Reservation
    const reservationResponse = await request(app)
      .post("/api/reservations")
      .set("x-api-key", apiKey)
      .send({
        ...reservationData,
        spaceId: spaceId,
      });

    expect(reservationResponse.status).toBe(201);
    expect(reservationResponse.body).toHaveProperty("id");
    expect(reservationResponse.body.spaceId).toBe(spaceId);
    expect(reservationResponse.body.clientEmail).toBe(
      reservationData.clientEmail,
    );
    expect(reservationResponse.body).toHaveProperty("space");
    expect(reservationResponse.body.space.id).toBe(spaceId);
    expect(reservationResponse.body.space).toHaveProperty("location");
    expect(reservationResponse.body.space.location.id).toBe(locationId);
    reservationId = reservationResponse.body.id;

    // Verify reservation exists in database
    const reservationInDb = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        space: {
          include: {
            location: true,
          },
        },
      },
    });
    expect(reservationInDb).not.toBeNull();
    expect(reservationInDb?.spaceId).toBe(spaceId);
    expect(reservationInDb?.clientEmail).toBe(reservationData.clientEmail);
    expect(reservationInDb?.space.id).toBe(spaceId);
    expect(reservationInDb?.space.location.id).toBe(locationId);

    // Step 4: List Reservations and validate that it appears
    const listResponse = await request(app)
      .get("/api/reservations?page=1&pageSize=10")
      .set("x-api-key", apiKey);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveProperty("data");
    expect(listResponse.body).toHaveProperty("meta");
    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.meta.total).toBeGreaterThanOrEqual(1);

    const foundReservation = listResponse.body.data.find(
      (r: any) => r.id === reservationId,
    );
    expect(foundReservation).toBeDefined();
    expect(foundReservation.spaceId).toBe(spaceId);
    expect(foundReservation.clientEmail).toBe(reservationData.clientEmail);
    expect(foundReservation.space).toBeDefined();
    expect(foundReservation.space.location).toBeDefined();
    expect(foundReservation.space.location.id).toBe(locationId);

    // Step 5: Get specific reservation by ID
    const getResponse = await request(app)
      .get(`/api/reservations/${reservationId}`)
      .set("x-api-key", apiKey);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(reservationId);
    expect(getResponse.body.spaceId).toBe(spaceId);
    expect(getResponse.body.space.id).toBe(spaceId);
    expect(getResponse.body.space.location.id).toBe(locationId);
  });

  it("should validate reservation business rules in E2E flow", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    // Create location and space
    const location = await prisma.location.create({
      data: {
        name: "Business Rules Location",
        coordinates: "40.7128,-74.0060",
      },
    });

    const space = await prisma.space.create({
      data: {
        name: "Business Rules Space",
        locationId: location.id,
        capacity: 10,
      },
    });

    // Create first reservation
    const reservation1 = await request(app)
      .post("/api/reservations")
      .set("x-api-key", apiKey)
      .send({
        spaceId: space.id,
        clientEmail: "rules-test@example.com",
        reservationAt: futureDate.toISOString(),
        startsAt: new Date(futureDate.getTime() + 3600000).toISOString(),
        endsAt: new Date(futureDate.getTime() + 7200000).toISOString(),
      });

    expect(reservation1.status).toBe(201);

    // Try to create conflicting reservation (time overlap)
    const conflictingReservation = await request(app)
      .post("/api/reservations")
      .set("x-api-key", apiKey)
      .send({
        spaceId: space.id,
        clientEmail: "another-client@example.com",
        reservationAt: futureDate.toISOString(),
        startsAt: new Date(futureDate.getTime() + 5400000).toISOString(),
        endsAt: new Date(futureDate.getTime() + 9000000).toISOString(),
      });

    expect(conflictingReservation.status).toBe(409);
    expect(conflictingReservation.body.message).toContain(
      "already reserved in the selected time range",
    );
  });
});

