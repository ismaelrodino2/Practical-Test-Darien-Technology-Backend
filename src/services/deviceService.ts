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

export type DeviceStateComparison = {
  isSynced: boolean;
  diff: {
    samplingIntervalSec?: { desired: number; reported: number | null };
    co2_alert_threshold?: { desired: number; reported: number | null };
  };
};

export async function compareStates(
  officeId: string,
): Promise<DeviceStateComparison | null> {
  const desired = await getDeviceDesired(officeId);
  const reported = await getDeviceReported(officeId);

  if (!desired) {
    return null;
  }

  const diff: DeviceStateComparison["diff"] = {};
  let isSynced = true;

  if (
    reported?.samplingIntervalSec !== undefined &&
    reported.samplingIntervalSec !== desired.samplingIntervalSec
  ) {
    diff.samplingIntervalSec = {
      desired: desired.samplingIntervalSec,
      reported: reported.samplingIntervalSec,
    };
    isSynced = false;
  }

  if (
    reported?.co2_alert_threshold !== undefined &&
    reported.co2_alert_threshold !== desired.co2_alert_threshold
  ) {
    diff.co2_alert_threshold = {
      desired: desired.co2_alert_threshold,
      reported: reported.co2_alert_threshold,
    };
    isSynced = false;
  }

  return { isSynced, diff };
}

export async function publishDesiredToMQTT(
  officeId: string,
  siteId: string,
  payload: DeviceDesiredPayload,
): Promise<void> {
  const { getMqttClient } = await import(
    "../integrations/mqtt/mqttClient"
  );
  const mqttClient = getMqttClient();
  const topic = `sites/${siteId}/offices/${officeId}/desired`;
  const mqttPayload = {
    samplingIntervalSec: payload.samplingIntervalSec,
    co2_alert_threshold: payload.co2_alert_threshold,
  };

  return new Promise<void>((resolve, reject) => {
    mqttClient.publish(
      topic,
      JSON.stringify(mqttPayload),
      { retain: true },
      (error) => {
        if (error) {
          console.error("[MQTT] Failed to publish desired state:", error.message);
          reject(error);
        } else {
          console.log(`[MQTT] Published desired state to ${topic} (retained)`);
          resolve();
        }
      },
    );
  });
}

