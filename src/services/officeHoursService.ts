import prisma from "../config/prismaClient";

/**
 * Checks if a time is within business hours
 */
export async function isWithinBusinessHours(
  officeId: string,
  date: Date = new Date(),
): Promise<boolean> {
  const officeHours = await prisma.officeHours.findUnique({
    where: { officeId },
  });

  if (!officeHours) {
    // If no hours configured, assume always open
    return true;
  }

  // Convert date to office timezone
  const tzDate = new Date(
    date.toLocaleString("en-US", { timeZone: officeHours.timezone }),
  );

  const currentTime = `${tzDate.getHours().toString().padStart(2, "0")}:${tzDate.getMinutes().toString().padStart(2, "0")}`;

  // Compare times (HH:mm format)
  return currentTime >= officeHours.openTime && currentTime <= officeHours.closeTime;
}

/**
 * Checks if there is an active reservation at the moment
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
 * Creates or updates business hours for an office
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
 * Gets business hours for an office
 */
export async function getOfficeHours(officeId: string) {
  return prisma.officeHours.findUnique({
    where: { officeId },
  });
}

