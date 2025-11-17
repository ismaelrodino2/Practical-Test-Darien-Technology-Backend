import prisma from "../config/prismaClient";
import { AlertKind, AlertStatus } from "@prisma/client";

export type AlertMeta = {
  co2_ppm?: number;
  threshold?: number;
  occupancy?: number;
  capacity?: number;
  reason?: string;
  [key: string]: unknown;
};

/**
 * Opens a new alert or returns the existing alert if already open
 */
export async function openAlert(
  officeId: string,
  kind: AlertKind,
  meta: AlertMeta = {},
): Promise<{ alert: unknown; isNew: boolean }> {
  // Check if an open alert of the same type already exists
  const existingAlert = await prisma.alert.findFirst({
    where: {
      officeId,
      kind,
      status: AlertStatus.OPEN,
    },
  });

  if (existingAlert) {
    // Update metadata if necessary
    if (JSON.stringify(existingAlert.metaJson) !== JSON.stringify(meta)) {
      await prisma.alert.update({
        where: { id: existingAlert.id },
        data: { metaJson: JSON.parse(JSON.stringify(meta)), updatedAt: new Date() },
      });
    }
    return { alert: existingAlert, isNew: false };
  }

  // Create new alert
  const alert = await prisma.alert.create({
    data: {
      officeId,
      kind,
      status: AlertStatus.OPEN,
      startedAt: new Date(),
      metaJson: JSON.parse(JSON.stringify(meta)),
    },
  });

  return { alert, isNew: true };
}

/**
 * Resolves an open alert
 */
export async function resolveAlert(
  officeId: string,
  kind: AlertKind,
): Promise<unknown | null> {
  const alert = await prisma.alert.findFirst({
    where: {
      officeId,
      kind,
      status: AlertStatus.OPEN,
    },
  });

  if (!alert) {
    return null;
  }

  return prisma.alert.update({
    where: { id: alert.id },
    data: {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Gets active alerts for an office
 */
export async function getActiveAlerts(officeId: string) {
  return prisma.alert.findMany({
    where: {
      officeId,
      status: AlertStatus.OPEN,
    },
    orderBy: { startedAt: "desc" },
  });
}

/**
 * Gets a specific alert by ID
 */
export async function getAlertById(id: string) {
  return prisma.alert.findUnique({
    where: { id },
  });
}

