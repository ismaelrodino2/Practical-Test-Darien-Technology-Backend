import prisma from "../config/prismaClient";
import { createHttpError } from "../utils/httpError";
import { ReservationPayload } from "../validators/reservationValidator";

/**
 * Lista reservas com paginação
 */
export async function listReservations(options: {
  page?: number;
  pageSize?: number;
}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      skip,
      take: pageSize,
      include: {
        space: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.reservation.count(),
  ]);

  return {
    data: reservations,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Busca uma reserva por ID
 */
export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      space: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!reservation) {
    throw createHttpError("Reservation not found.", 404);
  }

  return reservation;
}

/**
 * Cria uma nova reserva
 */
export async function createReservation(payload: ReservationPayload) {
  // Verifica se o space existe
  const space = await prisma.space.findUnique({
    where: { id: payload.spaceId },
  });

  if (!space) {
    throw createHttpError("Space not found.", 404);
  }

  // Verifica conflitos de horário
  const conflictingReservation = await prisma.reservation.findFirst({
    where: {
      spaceId: payload.spaceId,
      OR: [
        {
          AND: [
            { startsAt: { lte: payload.startsAt } },
            { endsAt: { gte: payload.startsAt } },
          ],
        },
        {
          AND: [
            { startsAt: { lte: payload.endsAt } },
            { endsAt: { gte: payload.endsAt } },
          ],
        },
        {
          AND: [
            { startsAt: { gte: payload.startsAt } },
            { endsAt: { lte: payload.endsAt } },
          ],
        },
      ],
    },
  });

  if (conflictingReservation) {
    throw createHttpError(
      "There is already a reservation for this time slot.",
      409,
    );
  }

  return prisma.reservation.create({
    data: {
      spaceId: payload.spaceId,
      locationId: payload.locationId ?? space.locationId,
      clientEmail: payload.clientEmail,
      reservationAt: payload.reservationAt,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    },
    include: {
      space: {
        include: {
          location: true,
        },
      },
    },
  });
}

/**
 * Atualiza uma reserva existente
 */
export async function updateReservation(
  id: string,
  payload: ReservationPayload,
) {
  // Verifica se a reserva existe
  const existingReservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!existingReservation) {
    throw createHttpError("Reservation not found.", 404);
  }

  // Verifica conflitos de horário (excluindo a própria reserva)
  const conflictingReservation = await prisma.reservation.findFirst({
    where: {
      id: { not: id },
      spaceId: payload.spaceId,
      OR: [
        {
          AND: [
            { startsAt: { lte: payload.startsAt } },
            { endsAt: { gte: payload.startsAt } },
          ],
        },
        {
          AND: [
            { startsAt: { lte: payload.endsAt } },
            { endsAt: { gte: payload.endsAt } },
          ],
        },
        {
          AND: [
            { startsAt: { gte: payload.startsAt } },
            { endsAt: { lte: payload.endsAt } },
          ],
        },
      ],
    },
  });

  if (conflictingReservation) {
    throw createHttpError(
      "There is already a reservation for this time slot.",
      409,
    );
  }

  return prisma.reservation.update({
    where: { id },
    data: {
      spaceId: payload.spaceId,
      locationId: payload.locationId,
      clientEmail: payload.clientEmail,
      reservationAt: payload.reservationAt,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    },
    include: {
      space: {
        include: {
          location: true,
        },
      },
    },
  });
}

/**
 * Deleta uma reserva
 */
export async function deleteReservation(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    throw createHttpError("Reservation not found.", 404);
  }

  await prisma.reservation.delete({
    where: { id },
  });
}

/**
 * Busca reservas ativas para um space em um determinado momento
 */
export async function getActiveReservations(
  spaceId: string,
  date: Date = new Date(),
) {
  return prisma.reservation.findMany({
    where: {
      spaceId,
      startsAt: { lte: date },
      endsAt: { gte: date },
    },
    include: {
      space: true,
    },
  });
}
