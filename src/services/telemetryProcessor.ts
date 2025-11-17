import { getDeviceDesired } from "./deviceService";
import { getSpaceByOfficeExternalId } from "./spaceService";
import { getActiveReservations } from "./reservationService";
import { openAlert, resolveAlert, type AlertMeta } from "./alertService";
import { AlertKind } from "@prisma/client";
import { broadcastAlert } from "../integrations/ws/websocketServer";
import { isWithinBusinessHours } from "./officeHoursService";

/**
 * Tracking state for each alert type per office
 */
type AlertTrackingState = {
  anomalyStartTime: Date | null;
  normalStartTime: Date | null;
  lastValue: {
    co2_ppm?: number;
    occupancy?: number;
  };
};

const alertTracking = new Map<string, Map<AlertKind, AlertTrackingState>>();

/**
 * Gets or creates tracking state for an office and alert type
 */
function getTrackingState(
  officeId: string,
  kind: AlertKind,
): AlertTrackingState {
  if (!alertTracking.has(officeId)) {
    alertTracking.set(officeId, new Map());
  }
  const officeTracking = alertTracking.get(officeId)!;

  if (!officeTracking.has(kind)) {
    officeTracking.set(kind, {
      anomalyStartTime: null,
      normalStartTime: null,
      lastValue: {},
    });
  }

  return officeTracking.get(kind)!;
}

/**
 * Processes telemetry and detects/resolves alerts
 */
export async function processTelemetry(
  officeId: string,
  telemetry: {
    co2_ppm?: number;
    occupancy?: number;
    ts?: string;
  },
): Promise<void> {
  const now = new Date();

  // Process each alert type
  await Promise.all([
    processCO2Alert(officeId, telemetry, now),
    processOccupancyMaxAlert(officeId, telemetry, now),
    processOccupancyUnexpectedAlert(officeId, telemetry, now),
  ]);
}

/**
 * Alert 1: High CO₂
 * Open: co2_ppm > threshold for 5 minutes
 * Resolve: co2_ppm <= threshold for 2 minutes
 */
async function processCO2Alert(
  officeId: string,
  telemetry: { co2_ppm?: number },
  now: Date,
): Promise<void> {
  if (telemetry.co2_ppm === undefined) {
    return;
  }

  const desired = await getDeviceDesired(officeId);
  if (!desired) {
    return; // No configuration, cannot alert
  }

  const threshold = desired.co2_alert_threshold;
  const state = getTrackingState(officeId, AlertKind.CO2);
  state.lastValue.co2_ppm = telemetry.co2_ppm;

  const isAnomaly = telemetry.co2_ppm > threshold;
  const isNormal = telemetry.co2_ppm <= threshold;

  if (isAnomaly) {
    // Anomaly detected
    if (!state.anomalyStartTime) {
      state.anomalyStartTime = now;
      state.normalStartTime = null;
    }

    const anomalyDuration = now.getTime() - state.anomalyStartTime.getTime();
    const minDurationToOpen = 5 * 60 * 1000; // 5 minutes

    if (anomalyDuration >= minDurationToOpen) {
      // Open alert
      const { alert, isNew } = await openAlert(officeId, AlertKind.CO2, {
        co2_ppm: telemetry.co2_ppm,
        threshold,
      } as AlertMeta);

      if (isNew) {
        broadcastAlert({
          type: "alert_opened",
          officeId,
          kind: AlertKind.CO2,
          alert,
        });
      }
    }
  } else if (isNormal) {
    // Normal condition
    if (!state.normalStartTime) {
      state.normalStartTime = now;
    }

    const normalDuration = now.getTime() - state.normalStartTime.getTime();
    const minDurationToResolve = 2 * 60 * 1000; // 2 minutes

    if (normalDuration >= minDurationToResolve) {
      // Resolve alert
      const resolved = await resolveAlert(officeId, AlertKind.CO2);
      if (resolved) {
        state.anomalyStartTime = null;
        state.normalStartTime = null;
        broadcastAlert({
          type: "alert_resolved",
          officeId,
          kind: AlertKind.CO2,
          alert: resolved,
        });
      }
    }

    // Reset anomaly start if returned to normal
    state.anomalyStartTime = null;
  }
}

/**
 * Alert 2: Maximum occupancy exceeded
 * Open: occupancy > capacity for 2 minutes
 * Resolve: occupancy <= capacity for 1 minute
 */
async function processOccupancyMaxAlert(
  officeId: string,
  telemetry: { occupancy?: number },
  now: Date,
): Promise<void> {
  if (telemetry.occupancy === undefined) {
    return;
  }

  const space = await getSpaceByOfficeExternalId(officeId);
  if (!space) {
    return; // Office not found
  }

  const capacity = space.capacity;
  const state = getTrackingState(officeId, AlertKind.OCCUPANCY_MAX);
  state.lastValue.occupancy = telemetry.occupancy;

  const isAnomaly = telemetry.occupancy > capacity;
  const isNormal = telemetry.occupancy <= capacity;

  if (isAnomaly) {
    if (!state.anomalyStartTime) {
      state.anomalyStartTime = now;
      state.normalStartTime = null;
    }

    const anomalyDuration = now.getTime() - state.anomalyStartTime.getTime();
    const minDurationToOpen = 2 * 60 * 1000; // 2 minutes

    if (anomalyDuration >= minDurationToOpen) {
      const { alert, isNew } = await openAlert(
        officeId,
        AlertKind.OCCUPANCY_MAX,
        {
          occupancy: telemetry.occupancy,
          capacity,
        } as AlertMeta,
      );

      if (isNew) {
        broadcastAlert({
          type: "alert_opened",
          officeId,
          kind: AlertKind.OCCUPANCY_MAX,
          alert,
        });
      }
    }
  } else if (isNormal) {
    if (!state.normalStartTime) {
      state.normalStartTime = now;
    }

    const normalDuration = now.getTime() - state.normalStartTime.getTime();
    const minDurationToResolve = 1 * 60 * 1000; // 1 minute

    if (normalDuration >= minDurationToResolve) {
      const resolved = await resolveAlert(officeId, AlertKind.OCCUPANCY_MAX);
      if (resolved) {
        state.anomalyStartTime = null;
        state.normalStartTime = null;
        broadcastAlert({
          type: "alert_resolved",
          officeId,
          kind: AlertKind.OCCUPANCY_MAX,
          alert: resolved,
        });
      }
    }

    state.anomalyStartTime = null;
  }
}

/**
 * Alert 3: Unexpected occupancy
 * 3a) Outside business hours: occupancy > 0 for 10 min
 * 3b) Without reservation: occupancy > 0 for 10 min within business hours without active reservation
 * Resolve: occupancy == 0 for 5 min OR business hours return OR reservation appears
 */
async function processOccupancyUnexpectedAlert(
  officeId: string,
  telemetry: { occupancy?: number },
  now: Date,
): Promise<void> {
  if (telemetry.occupancy === undefined) {
    return;
  }

  const space = await getSpaceByOfficeExternalId(officeId);
  if (!space) {
    return;
  }

  const state = getTrackingState(officeId, AlertKind.OCCUPANCY_UNEXPECTED);
  state.lastValue.occupancy = telemetry.occupancy;

  const hasOccupancy = telemetry.occupancy > 0;
  const noOccupancy = telemetry.occupancy === 0;

  // Check conditions to open alert
  const withinBusinessHours = await isWithinBusinessHours(officeId, now);
  const activeReservations = await getActiveReservations(space.id, now);
  const hasActiveReserv = activeReservations.length > 0;

  let shouldAlert = false;
  let reason = "";

  if (hasOccupancy) {
    if (!withinBusinessHours) {
      // 3a) Outside business hours
      shouldAlert = true;
      reason = "outside_business_hours";
    } else if (!hasActiveReserv) {
      // 3b) Within business hours but without reservation
      shouldAlert = true;
      reason = "no_active_reservation";
    }
  }

  if (shouldAlert) {
    if (!state.anomalyStartTime) {
      state.anomalyStartTime = now;
      state.normalStartTime = null;
    }

    const anomalyDuration = now.getTime() - state.anomalyStartTime.getTime();
    const minDurationToOpen = 10 * 60 * 1000; // 10 minutes

    if (anomalyDuration >= minDurationToOpen) {
      const { alert, isNew } = await openAlert(
        officeId,
        AlertKind.OCCUPANCY_UNEXPECTED,
        {
          occupancy: telemetry.occupancy,
          reason,
          withinBusinessHours,
          hasActiveReservation: hasActiveReserv,
        } as AlertMeta,
      );

      if (isNew) {
        broadcastAlert({
          type: "alert_opened",
          officeId,
          kind: AlertKind.OCCUPANCY_UNEXPECTED,
          alert,
        });
      }
    }
  } else {
    // Condition to resolve: occupancy == 0 OR valid business hours OR active reservation
    const shouldResolve =
      noOccupancy ||
      (withinBusinessHours && hasActiveReserv) ||
      (withinBusinessHours && !hasOccupancy);

    if (shouldResolve) {
      if (!state.normalStartTime) {
        state.normalStartTime = now;
      }

      const normalDuration = now.getTime() - state.normalStartTime.getTime();
      const minDurationToResolve = 5 * 60 * 1000; // 5 minutes

      if (normalDuration >= minDurationToResolve || noOccupancy) {
        const resolved = await resolveAlert(
          officeId,
          AlertKind.OCCUPANCY_UNEXPECTED,
        );
        if (resolved) {
          state.anomalyStartTime = null;
          state.normalStartTime = null;
          broadcastAlert({
            type: "alert_resolved",
            officeId,
            kind: AlertKind.OCCUPANCY_UNEXPECTED,
            alert: resolved,
          });
        }
      }
    } else {
      // Reset normal start if condition changed
      state.normalStartTime = null;
    }

    // Reset anomaly start if should not alert anymore
    if (!shouldAlert) {
      state.anomalyStartTime = null;
    }
  }
}

