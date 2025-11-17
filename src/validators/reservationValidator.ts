import { createHttpError } from "../utils/httpError";

export interface ReservationPayload {
  spaceId: string;
  locationId?: string;
  clientEmail: string;
  reservationAt: Date;
  startsAt: Date;
  endsAt: Date;
}

export function validateReservationPayload(
  body: Record<string, unknown>,
): ReservationPayload {
  if (!body || typeof body !== "object") {
    throw createHttpError("Invalid payload.", 400);
  }

  const {
    spaceId,
    locationId,
    clientEmail,
    reservationAt,
    startsAt,
    endsAt,
  } = body as {
    spaceId?: string;
    locationId?: string;
    clientEmail?: string;
    reservationAt?: string | Date;
    startsAt?: string | Date;
    endsAt?: string | Date;
  };

  if (!spaceId || typeof spaceId !== "string") {
    throw createHttpError("spaceId is required.", 422);
  }

  if (!clientEmail || typeof clientEmail !== "string") {
    throw createHttpError("clientEmail is required.", 422);
  }

  // If reservationAt is not provided, use today's date
  const reservationDate = reservationAt
    ? parseDate(reservationAt, "reservationAt")
    : new Date();
  
  const startsDate = parseDate(startsAt, "startsAt");
  const endsDate = parseDate(endsAt, "endsAt");

  if (startsDate >= endsDate) {
    throw createHttpError("startsAt must be earlier than endsAt.", 422);
  }

  const now = new Date();

  if (startsDate < now || endsDate < now) {
    throw createHttpError("Reservation times must be in the future.", 422);
  }

  return {
    spaceId,
    locationId,
    clientEmail: clientEmail.toLowerCase().trim(),
    reservationAt: reservationDate,
    startsAt: startsDate,
    endsAt: endsDate,
  };
}

function parseDate(value: string | Date | undefined, field: string): Date {
  if (!value) {
    throw createHttpError(`${field} is required.`, 422);
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`${field} is invalid.`, 422);
  }

  return date;
}

