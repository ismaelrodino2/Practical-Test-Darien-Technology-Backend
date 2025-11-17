import prisma from "../config/prismaClient";

/**
 * Verifica se um horário está dentro do horário laboral
 */
export async function isWithinBusinessHours(
  officeId: string,
  date: Date = new Date(),
): Promise<boolean> {
  const officeHours = await prisma.officeHours.findUnique({
    where: { officeId },
  });

  if (!officeHours) {
    // Se não há horário configurado, assume sempre aberto
    return true;
  }

  // Converte data para o timezone do office
  const tzDate = new Date(
    date.toLocaleString("en-US", { timeZone: officeHours.timezone }),
  );

  const currentTime = `${tzDate.getHours().toString().padStart(2, "0")}:${tzDate.getMinutes().toString().padStart(2, "0")}`;

  // Compara horários (formato HH:mm)
  return currentTime >= officeHours.openTime && currentTime <= officeHours.closeTime;
}

/**
 * Verifica se há uma reserva ativa no momento
 */
export async function hasActiveReservation(
  spaceId: string,
  date: Date = new Date(),
): Promise<boolean> {
  const activeReservation = await prisma.reservation.findFirst({
    where: {
      spaceId,
      startsAt: { lte: date },
      endsAt: { gte: date },
    },
  });

  return !!activeReservation;
}

/**
 * Cria ou atualiza horário laboral de um office
 */
export async function upsertOfficeHours(
  officeId: string,
  data: {
    openTime: string; // HH:mm
    closeTime: string; // HH:mm
    timezone: string; // IANA timezone
  },
) {
  return prisma.officeHours.upsert({
    where: { officeId },
    update: data,
    create: {
      officeId,
      ...data,
    },
  });
}

/**
 * Busca horário laboral de um office
 */
export async function getOfficeHours(officeId: string) {
  return prisma.officeHours.findUnique({
    where: { officeId },
  });
}

