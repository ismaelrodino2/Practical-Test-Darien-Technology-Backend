import { createReservation } from "../../services/reservationService";
import { ReservationPayload } from "../../validators/reservationValidator";
import prisma from "../../config/prismaClient";

jest.mock("../../config/prismaClient", () => ({
  __esModule: true,
  default: {
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    space: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Reservation Service - Unit Tests", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  const mockSpace = {
    id: "space-1",
    name: "Test Space",
    locationId: "location-1",
    location: {
      id: "location-1",
      name: "Test Location",
    },
  };

  const basePayload: ReservationPayload = {
    spaceId: "space-1",
    clientEmail: "client@example.com",
    reservationAt: new Date("2024-01-15T10:00:00Z"),
    startsAt: new Date("2024-01-15T14:00:00Z"),
    endsAt: new Date("2024-01-15T16:00:00Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.space.findUnique as jest.Mock).mockResolvedValue(
      mockSpace as any,
    );
  });

  describe("createReservation", () => {
    it("should prevent reservation with time conflict on the same space - throw error with 409 status", async () => {
      const conflictingReservation = {
        id: "reservation-1",
        spaceId: "space-1",
      };

      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(
        conflictingReservation as any,
      );

      await expect(createReservation(basePayload)).rejects.toThrow(
        "There is already a reservation for this time slot.",
      );

      expect(mockPrisma.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          OR: [
            {
              AND: [
                { startsAt: { lte: basePayload.startsAt } },
                { endsAt: { gte: basePayload.startsAt } },
              ],
            },
            {
              AND: [
                { startsAt: { lte: basePayload.endsAt } },
                { endsAt: { gte: basePayload.endsAt } },
              ],
            },
            {
              AND: [
                { startsAt: { gte: basePayload.startsAt } },
                { endsAt: { lte: basePayload.endsAt } },
              ],
            },
          ],
        },
      });
      expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
    });

    it("should create a valid reservation when there are no conflicts", async () => {
      const createdReservation = {
        id: "reservation-1",
        ...basePayload,
        locationId: "location-1",
        space: {
          ...mockSpace,
          location: mockSpace.location,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.reservation.create as jest.Mock).mockResolvedValue(
        createdReservation as any,
      );

      const result = await createReservation(basePayload);

      expect(result).toEqual(createdReservation);
      expect(mockPrisma.reservation.findFirst).toHaveBeenCalled();
      expect(mockPrisma.reservation.create).toHaveBeenCalledWith({
        data: {
          spaceId: basePayload.spaceId,
          locationId: "location-1",
          clientEmail: basePayload.clientEmail,
          reservationAt: basePayload.reservationAt,
          startsAt: basePayload.startsAt,
          endsAt: basePayload.endsAt,
        },
        include: {
          space: { include: { location: true } },
        },
      });
    });
  });
});

