import prisma from "../config/prismaClient";

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: { name: "asc" },
  });
}


