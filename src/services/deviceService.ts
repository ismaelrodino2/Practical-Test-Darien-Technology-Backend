import prisma from "../config/prismaClient";

export type DeviceDesiredPayload = {
  samplingIntervalSec: number;
  co2_alert_threshold: number;
};

export async function upsertDeviceDesired(
  officeId: string,
  payload: DeviceDesiredPayload,
) {
  return prisma.deviceDesired.upsert({
    where: { officeId },
    update: {
      samplingIntervalSec: payload.samplingIntervalSec,
      co2_alert_threshold: payload.co2_alert_threshold,
    },
    create: {
      officeId,
      samplingIntervalSec: payload.samplingIntervalSec,
      co2_alert_threshold: payload.co2_alert_threshold,
    },
  });
}

export async function getDeviceDesired(officeId: string) {
  return prisma.deviceDesired.findUnique({
    where: { officeId },
  });
}

export async function upsertDeviceReported(
  officeId: string,
  payload: Partial<DeviceDesiredPayload>,
) {
  return prisma.deviceReported.upsert({
    where: { officeId },
    update: {
      samplingIntervalSec: payload.samplingIntervalSec ?? undefined,
      co2_alert_threshold: payload.co2_alert_threshold ?? undefined,
    },
    create: {
      officeId,
      samplingIntervalSec: payload.samplingIntervalSec ?? null,
      co2_alert_threshold: payload.co2_alert_threshold ?? null,
    },
  });
}

export async function getDeviceReported(officeId: string) {
  return prisma.deviceReported.findUnique({
    where: { officeId },
  });
}

