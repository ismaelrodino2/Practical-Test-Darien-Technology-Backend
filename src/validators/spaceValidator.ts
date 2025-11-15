import { createHttpError } from "../utils/httpError";

interface SpacePayload {
  locationId: string;
  name: string;
  reference?: string;
  capacity: number;
  description?: string;
}

export function validateSpacePayload(body: Record<string, unknown>): SpacePayload {
  if (!body || typeof body !== "object") {
    throw createHttpError("Invalid payload.", 400);
  }

  const { locationId, name, reference, capacity, description } =
    body as Partial<SpacePayload>;

  if (!locationId || typeof locationId !== "string") {
    throw createHttpError("locationId is required.", 422);
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw createHttpError("name is required.", 422);
  }

  if (
    typeof capacity !== "number" ||
    !Number.isInteger(capacity) ||
    capacity <= 0
  ) {
    throw createHttpError("capacity must be a positive integer.", 422);
  }

  return {
    locationId,
    name: name.trim(),
    reference: reference?.trim(),
    capacity,
    description: description?.trim(),
  };
}

