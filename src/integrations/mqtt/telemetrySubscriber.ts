import mqttClient from "./mqttClient";
import { broadcastTelemetry } from "../ws/websocketServer";
import {
  upsertDeviceReported,
  upsertDeviceDesired,
  compareStates,
} from "../../services/deviceService";

export const startTelemetrySubscriber = (siteId: string, officeId: string) => {
  const telemetryTopic = `sites/${siteId}/offices/${officeId}/telemetry`;
  const reportedTopic = `sites/${siteId}/offices/${officeId}/reported`;
  const desiredTopic = `sites/${siteId}/offices/${officeId}/desired`;

  const subscribeToTopics = () => {
    if (!mqttClient.connected) {
      return;
    }

    mqttClient.subscribe(telemetryTopic, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${telemetryTopic}`);
    });

    mqttClient.subscribe(reportedTopic, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${reportedTopic}`);
    });

    mqttClient.subscribe(desiredTopic, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${desiredTopic}`);
    });
  };

  const handleMessage = async (incomingTopic: string, payload: Buffer) => {
    // Handle telemetry messages
    if (incomingTopic === telemetryTopic) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log("Telemetry received:", parsed);
        broadcastTelemetry(parsed);
      } catch (error) {
        console.log("Telemetry received (raw):", payload.toString());
        broadcastTelemetry(payload.toString());
      }
      return;
    }

    // Handle reported messages (device state)
    if (incomingTopic === reportedTopic) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log("Reported state received:", parsed);

        // Atualizar device_reported no banco
        await upsertDeviceReported(officeId, {
          samplingIntervalSec: parsed.samplingIntervalSec,
          co2_alert_threshold: parsed.co2_alert_threshold,
        });

        // Comparar com desired e registrar divergências
        const comparison = await compareStates(officeId);
        if (comparison && !comparison.isSynced) {
          console.warn(
            `[Device Twin] State divergence detected for office ${officeId}:`,
            comparison.diff,
          );
        }
      } catch (error) {
        console.error("[MQTT] Failed to process reported state:", error);
      }
      return;
    }

    // Handle desired messages (if device publishes desired state back)
    if (incomingTopic === desiredTopic) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log("Desired state received (from device):", parsed);

        // Atualizar device_desired no banco (sync from device)
        await upsertDeviceDesired(officeId, {
          samplingIntervalSec: parsed.samplingIntervalSec,
          co2_alert_threshold: parsed.co2_alert_threshold,
        });
      } catch (error) {
        console.error("[MQTT] Failed to process desired state:", error);
      }
      return;
    }
  };

  const handleConnect = () => subscribeToTopics();

  if (mqttClient.connected) {
    subscribeToTopics();
  }

  mqttClient.on("connect", handleConnect);
  mqttClient.on("message", handleMessage);

  return () => {
    mqttClient.off("message", handleMessage);
    mqttClient.unsubscribe(telemetryTopic);
    mqttClient.unsubscribe(reportedTopic);
    mqttClient.unsubscribe(desiredTopic);
    mqttClient.off("connect", handleConnect);
  };
};

export default startTelemetrySubscriber;



