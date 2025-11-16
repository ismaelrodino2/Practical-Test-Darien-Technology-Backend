import request from "supertest";
import app from "../../app";
import prisma from "../../config/prismaClient";

// Checks if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.location.findFirst({ take: 1 });
    return true;
  } catch (error) {
    return false;
  }
}

describe("Reservation Routes - Integration Tests", () => {
  const apiKey = process.env.API_KEY || "test-api-key";
  let databaseAvailable = false;

  beforeAll(async () => {
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn(
        "⚠️  Database not available. Integration tests will be skipped. " +
        "Make sure PostgreSQL is running at localhost:5432 or set DATABASE_URL in .env"
      );
      return;
    }

    await prisma.reservation.deleteMany();
    await prisma.space.deleteMany();
    await prisma.location.deleteMany();
  });

  afterAll(async () => {
    if (databaseAvailable) {
      await prisma.reservation.deleteMany();
      await prisma.space.deleteMany();
      await prisma.location.deleteMany();
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;
    await prisma.reservation.deleteMany();
    await prisma.space.deleteMany();
    await prisma.location.deleteMany();
  });

  describe("POST /api/reservations", () => {
    it("should return 201 and create reservation in database", async () => {
      if (!databaseAvailable) {
        console.log("⏭️  Skipping integration test: database not available");
        return;
      }
      const location = await prisma.location.create({
        data: {
          name: "Test Location",
          coordinates: "40.7128,-74.0060",
        },
      });

      const space = await prisma.space.create({
        data: {
          name: "Test Space",
          locationId: location.id,
          capacity: 10,
        },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const reservationData = {
        spaceId: space.id,
        clientEmail: "test@example.com",
        reservationAt: futureDate.toISOString(),
        startsAt: new Date(futureDate.getTime() + 3600000).toISOString(),
        endsAt: new Date(futureDate.getTime() + 7200000).toISOString(),
      };

      const response = await request(app)
        .post("/api/reservations")
        .set("x-api-key", apiKey)
        .send(reservationData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.spaceId).toBe(space.id);
      expect(response.body.clientEmail).toBe("test@example.com");
      expect(response.body).toHaveProperty("space");
      expect(response.body.space).toHaveProperty("location");

      const reservationInDb = await prisma.reservation.findUnique({
        where: { id: response.body.id },
      });

      expect(reservationInDb).not.toBeNull();
      expect(reservationInDb?.spaceId).toBe(space.id);
      expect(reservationInDb?.clientEmail).toBe("test@example.com");
    });
  });

  describe("GET /api/reservations", () => {
    it("should paginate correctly with page=1 and pageSize=5", async () => {
      if (!databaseAvailable) {
        console.log("⏭️  Skipping integration test: database not available");
        return;
      }
      const location = await prisma.location.create({
        data: {
          name: "Test Location",
          coordinates: "40.7128,-74.0060",
        },
      });

      const space = await prisma.space.create({
        data: {
          name: "Test Space",
          locationId: location.id,
          capacity: 10,
        },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const reservations = [];
      for (let i = 0; i < 7; i++) {
        const reservation = await prisma.reservation.create({
          data: {
            spaceId: space.id,
            clientEmail: `test${i}@example.com`,
            reservationAt: new Date(futureDate.getTime() + i * 86400000),
            startsAt: new Date(
              futureDate.getTime() + i * 86400000 + 3600000,
            ),
            endsAt: new Date(futureDate.getTime() + i * 86400000 + 7200000),
          },
        });
        reservations.push(reservation);
      }

      const response = await request(app)
        .get("/api/reservations?page=1&pageSize=5")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.pageSize).toBe(5);
      expect(response.body.meta.total).toBe(7);
      expect(response.body.meta.totalPages).toBe(2);

      const page2Response = await request(app)
        .get("/api/reservations?page=2&pageSize=5")
        .set("x-api-key", apiKey);

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.data.length).toBe(2);
      expect(page2Response.body.meta.page).toBe(2);
    });

    it("should return empty array when no reservations exist", async () => {
      if (!databaseAvailable) {
        console.log("⏭️  Skipping integration test: database not available");
        return;
      }
      const response = await request(app)
        .get("/api/reservations?page=1&pageSize=5")
        .set("x-api-key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("should remove reservation and return 204", async () => {
      if (!databaseAvailable) {
        console.log("⏭️  Skipping integration test: database not available");
        return;
      }
      const location = await prisma.location.create({
        data: {
          name: "Test Location",
          coordinates: "40.7128,-74.0060",
        },
      });

      const space = await prisma.space.create({
        data: {
          name: "Test Space",
          locationId: location.id,
          capacity: 10,
        },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const reservation = await prisma.reservation.create({
        data: {
          spaceId: space.id,
          clientEmail: "test@example.com",
          reservationAt: futureDate,
          startsAt: new Date(futureDate.getTime() + 3600000),
          endsAt: new Date(futureDate.getTime() + 7200000),
        },
      });

      const response = await request(app)
        .delete(`/api/reservations/${reservation.id}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const reservationInDb = await prisma.reservation.findUnique({
        where: { id: reservation.id },
      });

      expect(reservationInDb).toBeNull();
    });

    it("should return 404 when reservation does not exist", async () => {
      if (!databaseAvailable) {
        console.log("⏭️  Skipping integration test: database not available");
        return;
      }
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .delete(`/api/reservations/${nonExistentId}`)
        .set("x-api-key", apiKey);

      expect(response.status).toBe(404);
    });
  });
});

