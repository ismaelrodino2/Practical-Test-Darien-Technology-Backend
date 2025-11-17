import { getDeviceDesired } from "./deviceService";
import { getSpaceByOfficeExternalId } from "./spaceService";
import { getActiveReservations } from "./reservationService";
import { openAlert, resolveAlert, type AlertMeta } from "./alertService";
import { AlertKind } from "@prisma/client";
import { broadcastAlert } from "../integrations/ws/websocketServer";
import { isWithinBusinessHours } from "./officeHoursService";

/**
 * Estado de tracking para cada tipo de alerta por office
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
 * Obtém ou cria o estado de tracking para um office e tipo de alerta
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
 * Processa telemetria e detecta/resolve alertas
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

  // Processa cada tipo de alerta
  await Promise.all([
    processCO2Alert(officeId, telemetry, now),
    processOccupancyMaxAlert(officeId, telemetry, now),
    processOccupancyUnexpectedAlert(officeId, telemetry, now),
  ]);
}

/**
 * Alerta 1: CO₂ alto
 * Abrir: co2_ppm > threshold por 5 minutos
 * Resolver: co2_ppm <= threshold por 2 minutos
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
    return; // Sem configuração, não pode alertar
  }

  const threshold = desired.co2_alert_threshold;
  const state = getTrackingState(officeId, AlertKind.CO2);
  state.lastValue.co2_ppm = telemetry.co2_ppm;

  const isAnomaly = telemetry.co2_ppm > threshold;
  const isNormal = telemetry.co2_ppm <= threshold;

  if (isAnomaly) {
    // Anomalia detectada
    if (!state.anomalyStartTime) {
      state.anomalyStartTime = now;
      state.normalStartTime = null;
    }

    const anomalyDuration = now.getTime() - state.anomalyStartTime.getTime();
    const minDurationToOpen = 5 * 60 * 1000; // 5 minutos

    if (anomalyDuration >= minDurationToOpen) {
      // Abre alerta
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
    // Condição normal
    if (!state.normalStartTime) {
      state.normalStartTime = now;
    }

    const normalDuration = now.getTime() - state.normalStartTime.getTime();
    const minDurationToResolve = 2 * 60 * 1000; // 2 minutos

    if (normalDuration >= minDurationToResolve) {
      // Resolve alerta
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

    // Reset anomaly start se voltou ao normal
    state.anomalyStartTime = null;
  }
}

/**
 * Alerta 2: Ocupação máxima excedida
 * Abrir: occupancy > capacity por 2 minutos
 * Resolver: occupancy <= capacity por 1 minuto
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
    return; // Office não encontrado
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
    const minDurationToOpen = 2 * 60 * 1000; // 2 minutos

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
    const minDurationToResolve = 1 * 60 * 1000; // 1 minuto

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
 * Alerta 3: Ocupação inesperada
 * 3a) Fora do horário: occupancy > 0 por 10 min
 * 3b) Sem reserva: occupancy > 0 por 10 min dentro do horário sem reserva ativa
 * Resolver: occupancy == 0 por 5 min OU horário volta OU reserva aparece
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

  // Verifica condições para abrir alerta
  const withinBusinessHours = await isWithinBusinessHours(officeId, now);
  const activeReservations = await getActiveReservations(space.id, now);
  const hasActiveReserv = activeReservations.length > 0;

  let shouldAlert = false;
  let reason = "";

  if (hasOccupancy) {
    if (!withinBusinessHours) {
      // 3a) Fora do horário laboral
      shouldAlert = true;
      reason = "outside_business_hours";
    } else if (!hasActiveReserv) {
      // 3b) Dentro do horário mas sem reserva
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
    const minDurationToOpen = 10 * 60 * 1000; // 10 minutos

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
    // Condição para resolver: occupancy == 0 OU horário válido OU reserva ativa
    const shouldResolve =
      noOccupancy ||
      (withinBusinessHours && hasActiveReserv) ||
      (withinBusinessHours && !hasOccupancy);

    if (shouldResolve) {
      if (!state.normalStartTime) {
        state.normalStartTime = now;
      }

      const normalDuration = now.getTime() - state.normalStartTime.getTime();
      const minDurationToResolve = 5 * 60 * 1000; // 5 minutos

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
      // Reset normal start se condição mudou
      state.normalStartTime = null;
    }

    // Reset anomaly start se não deve alertar mais
    if (!shouldAlert) {
      state.anomalyStartTime = null;
    }
  }
}

