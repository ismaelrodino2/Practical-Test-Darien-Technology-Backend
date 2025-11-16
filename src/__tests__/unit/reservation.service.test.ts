import {
  createReservation,
  ReservationPayload,
} from "../../services/reservationService";
import prisma from "../../config/prismaClient";
import { createHttpError } from "../../utils/httpError";
import { getWeekRange } from "../../utils/dateRange";

jest.mock("../../config/prismaClient", () => ({
  __esModule: true,
  default: {
    reservation: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    space: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../utils/dateRange");

describe("Reservation Service - Unit Tests", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockGetWeekRange = getWeekRange as jest.MockedFunction<
    typeof getWeekRange
  >;

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
        "This space is already reserved in the selected time range.",
      );

      expect(mockPrisma.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          id: undefined,
          AND: [
            { startsAt: { lt: basePayload.endsAt } },
            { endsAt: { gt: basePayload.startsAt } },
          ],
        },
        select: { id: true },
      });
      expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
    });

    it("should prevent client from making more than 3 reservations in the same week - throw error with 422 status", async () => {
      const weekStart = new Date("2024-01-15T00:00:00Z");
      const weekEnd = new Date("2024-01-22T00:00:00Z");

      mockGetWeekRange.mockReturnValue({
        start: weekStart,
        end: weekEnd,
      });

      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.reservation.count as jest.Mock).mockResolvedValue(3);

      await expect(createReservation(basePayload)).rejects.toThrow(
        "Weekly reservation limit of 3 exceeded for this client.",
      );

      expect(mockPrisma.reservation.count).toHaveBeenCalledWith({
        where: {
          clientEmail: "client@example.com",
          reservationAt: {
            gte: weekStart,
            lt: weekEnd,
          },
          id: undefined,
        },
      });
      expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
    });

    it("should create a valid reservation when there are no conflicts", async () => {
      const weekStart = new Date("2024-01-15T00:00:00Z");
      const weekEnd = new Date("2024-01-22T00:00:00Z");

      mockGetWeekRange.mockReturnValue({
        start: weekStart,
        end: weekEnd,
      });

      const createdReservation = {
        id: "reservation-1",
        ...basePayload,
        locationId: "location-1",
        space: mockSpace,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.reservation.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.reservation.create as jest.Mock).mockResolvedValue(
        createdReservation as any,
      );

      const result = await createReservation(basePayload);

      expect(result).toEqual(createdReservation);
      expect(mockPrisma.reservation.findFirst).toHaveBeenCalled();
      expect(mockPrisma.reservation.count).toHaveBeenCalled();
      expect(mockPrisma.reservation.create).toHaveBeenCalledWith({
        data: {
          ...basePayload,
          locationId: "location-1",
        },
        include: {
          space: { include: { location: true } },
        },
      });
    });

    it("should allow reservation when weekly limit is exactly at 2 (below limit)", async () => {
      const weekStart = new Date("2024-01-15T00:00:00Z");
      const weekEnd = new Date("2024-01-22T00:00:00Z");

      mockGetWeekRange.mockReturnValue({
        start: weekStart,
        end: weekEnd,
      });

      const createdReservation = {
        id: "reservation-1",
        ...basePayload,
        locationId: "location-1",
        space: mockSpace,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.reservation.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.reservation.create as jest.Mock).mockResolvedValue(
        createdReservation as any,
      );

      const result = await createReservation(basePayload);

      expect(result).toEqual(createdReservation);
      expect(mockPrisma.reservation.create).toHaveBeenCalled();
    });
  });
});

