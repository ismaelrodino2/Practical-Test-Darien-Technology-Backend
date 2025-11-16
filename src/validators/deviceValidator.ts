import { createHttpError } from "../utils/httpError";

export type DeviceDesiredRequest = {
  samplingIntervalSec: number;
  co2_alert_threshold: number;
};

export function validateDeviceDesiredPayload(
  body: Record<string, unknown>,
): DeviceDesiredRequest {
  if (!body || typeof body !== "object") {
    throw createHttpError("Invalid payload.", 400);
  }

  const { samplingIntervalSec, co2_alert_threshold } =
    body as Partial<DeviceDesiredRequest>;

  if (
    typeof samplingIntervalSec !== "number" ||
    !Number.isInteger(samplingIntervalSec) ||
    samplingIntervalSec <= 0
  ) {
    throw createHttpError(
      "samplingIntervalSec must be a positive integer.",
      422,
    );
  }

  if (
    typeof co2_alert_threshold !== "number" ||
    !Number.isInteger(co2_alert_threshold) ||
    co2_alert_threshold <= 0
  ) {
    throw createHttpError(
      "co2_alert_threshold must be a positive integer.",
      422,
    );
  }

  return {
    samplingIntervalSec,
    co2_alert_threshold,
  };
}

