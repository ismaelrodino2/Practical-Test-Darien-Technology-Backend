import prisma from "../config/prismaClient";
import { createHttpError } from "../utils/httpError";

export type SpacePayload = {
  locationId: string;
  name: string;
  officeExternalId: string;
  reference?: string;
  capacity: number;
  description?: string;
};

export async function listSpaces() {
  return prisma.space.findMany({
    include: { location: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSpaceById(id: string) {
  const space = await prisma.space.findUnique({
    where: { id },
    include: { location: true },
  });

  if (!space) {
    throw createHttpError("Space not found.", 404);
  }

  return space;
}

export async function createSpace(payload: SpacePayload) {
  await ensureLocationExists(payload.locationId);

  return prisma.space.create({
    data: payload,
    include: { location: true },
  });
}

export async function updateSpace(id: string, payload: SpacePayload) {
  await getSpaceById(id);
  await ensureLocationExists(payload.locationId);

  return prisma.space.update({
    where: { id },
    data: payload,
    include: { location: true },
  });
}

export async function deleteSpace(id: string) {
  await getSpaceById(id);
  await prisma.space.delete({ where: { id } });
}

export async function getSpaceByOfficeExternalId(officeExternalId: string) {
  return prisma.space.findUnique({
    where: { officeExternalId },
    include: { location: true },
  });
}

async function ensureLocationExists(locationId: string) {
  const exists = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true },
  });

  if (!exists) {
    throw createHttpError("Invalid location.", 422);
  }
}

