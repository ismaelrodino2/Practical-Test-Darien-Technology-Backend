import { createHttpError } from "../utils/httpError";

export type DeviceDesiredRequest = {
  samplingIntervalSec?: number;
  co2_alert_threshold?: number;
};

export function validateDeviceDesiredPayload(
  body: Record<string, unknown>,
): DeviceDesiredRequest {
  if (!body || typeof body !== "object") {
    throw createHttpError("Invalid payload.", 400);
  }

  const { samplingIntervalSec, co2_alert_threshold } =
    body as Partial<DeviceDesiredRequest>;

  // Validate samplingIntervalSec if provided
  if (samplingIntervalSec !== undefined) {
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
  }

  // Validate co2_alert_threshold if provided
  if (co2_alert_threshold !== undefined) {
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
  }

  // At least one field must be provided
  if (samplingIntervalSec === undefined && co2_alert_threshold === undefined) {
    throw createHttpError(
      "At least one field (samplingIntervalSec or co2_alert_threshold) must be provided.",
      422,
    );
  }

  const result: DeviceDesiredRequest = {};
  if (samplingIntervalSec !== undefined) {
    result.samplingIntervalSec = samplingIntervalSec;
  }
  if (co2_alert_threshold !== undefined) {
    result.co2_alert_threshold = co2_alert_threshold;
  }

  return result;
}

