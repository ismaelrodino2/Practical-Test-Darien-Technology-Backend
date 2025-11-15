import prisma from "../config/prismaClient";
import { createHttpError } from "../utils/httpError";
import { MAX_WEEKLY_RESERVATIONS } from "../constants/reservations";
import { getWeekRange } from "../utils/dateRange";

export interface ReservationPayload {
  spaceId: string;
  locationId?: string;
  clientEmail: string;
  reservationAt: Date;
  startsAt: Date;
  endsAt: Date;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export async function listReservations({
  page = 1,
  pageSize = 10,
}: PaginationParams) {
  const skip = Math.max(page - 1, 0) * pageSize;

  const [data, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      skip,
      take: pageSize,
      orderBy: { reservationAt: "desc" },
      include: {
        space: {
          include: { location: true },
        },
      },
    }),
    prisma.reservation.count(),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      space: { include: { location: true } },
    },
  });

  if (!reservation) {
    throw createHttpError("Reservation not found.", 404);
  }

  return reservation;
}

export async function createReservation(payload: ReservationPayload) {
  const normalized = await normalizePayload(payload);

  await ensureNoTimeConflict(normalized);
  await ensureWeeklyLimit(normalized);

  return prisma.reservation.create({
    data: normalized,
    include: {
      space: { include: { location: true } },
    },
  });
}

export async function updateReservation(
  id: string,
  payload: ReservationPayload,
) {
  await getReservationById(id);
  const normalized = await normalizePayload(payload);

  await ensureNoTimeConflict(normalized, id);
  await ensureWeeklyLimit(normalized, id);

  return prisma.reservation.update({
    where: { id },
    data: normalized,
    include: {
      space: { include: { location: true } },
    },
  });
}

export async function deleteReservation(id: string) {
  await getReservationById(id);
  await prisma.reservation.delete({ where: { id } });
}

async function normalizePayload(
  payload: ReservationPayload,
): Promise<ReservationPayload> {
  const space = await prisma.space.findUnique({
    where: { id: payload.spaceId },
    include: { location: true },
  });

  if (!space) {
    throw createHttpError("Invalid space.", 422);
  }

  const locationId = payload.locationId ?? space.locationId;

  return {
    ...payload,
    locationId,
  };
}

async function ensureNoTimeConflict(
  payload: ReservationPayload,
  ignoreReservationId?: string,
) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      spaceId: payload.spaceId,
      id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
      AND: [
        { startsAt: { lt: payload.endsAt } },
        { endsAt: { gt: payload.startsAt } },
      ],
    },
    select: { id: true },
  });

  if (conflict) {
    throw createHttpError(
      "This space is already reserved in the selected time range.",
      409,
    );
  }
}

async function ensureWeeklyLimit(
  payload: ReservationPayload,
  ignoreReservationId?: string,
) {
  const { start, end } = getWeekRange(payload.reservationAt);

  const totalInWeek = await prisma.reservation.count({
    where: {
      clientEmail: payload.clientEmail,
      reservationAt: {
        gte: start,
        lt: end,
      },
      id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
    },
  });

  if (totalInWeek >= MAX_WEEKLY_RESERVATIONS) {
    throw createHttpError(
      `Weekly reservation limit of ${MAX_WEEKLY_RESERVATIONS} exceeded for this client.`,
      422,
    );
  }
}

