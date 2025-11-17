import mqttClient from "./mqttClient";
import { broadcastTelemetry } from "../ws/websocketServer";
import {
  upsertDeviceReported,
  upsertDeviceDesired,
  compareStates,
} from "../../services/deviceService";
import { processTelemetry } from "../../services/telemetryProcessor";

/**
 * Extrai siteId e officeId de um tópico MQTT
 * Exemplo: "sites/SITE_A/offices/OFFICE_1/telemetry" -> { siteId: "SITE_A", officeId: "OFFICE_1" }
 */
function extractSiteAndOffice(topic: string): {
  siteId: string;
  officeId: string;
} | null {
  const match = topic.match(/^sites\/([^/]+)\/offices\/([^/]+)\//);
  if (!match) {
    return null;
  }
  return {
    siteId: match[1],
    officeId: match[2],
  };
}

export const startTelemetrySubscriber = () => {
  // Usar wildcards para receber de todos os sites e offices
  const telemetryTopicPattern = "sites/+/offices/+/telemetry";
  const reportedTopicPattern = "sites/+/offices/+/reported";
  const desiredTopicPattern = "sites/+/offices/+/desired";

  const subscribeToTopics = () => {
    if (!mqttClient.connected) {
      return;
    }

    mqttClient.subscribe(telemetryTopicPattern, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${telemetryTopicPattern} (all sites/offices)`);
    });

    mqttClient.subscribe(reportedTopicPattern, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${reportedTopicPattern} (all sites/offices)`);
    });

    mqttClient.subscribe(desiredTopicPattern, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${desiredTopicPattern} (all sites/offices)`);
    });
  };

  const handleMessage = async (incomingTopic: string, payload: Buffer) => {
    const topicInfo = extractSiteAndOffice(incomingTopic);
    if (!topicInfo) {
      console.warn(`[MQTT] Invalid topic format: ${incomingTopic}`);
      return;
    }

    const { siteId, officeId } = topicInfo;

    // Handle telemetry messages
    if (incomingTopic.endsWith("/telemetry")) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log(`[MQTT] Telemetry received from ${siteId}/${officeId}:`, parsed);
        
        // Processar alertas baseado na telemetria
        await processTelemetry(officeId, parsed);
        
        // Incluir informações do tópico no payload
        const enrichedPayload = {
          ...parsed,
          siteId,
          officeId,
          topic: incomingTopic,
        };
        
        broadcastTelemetry(enrichedPayload);
      } catch (error) {
        console.error(`[MQTT] Failed to process telemetry from ${siteId}/${officeId}:`, error);
        console.log(`[MQTT] Telemetry received (raw) from ${siteId}/${officeId}:`, payload.toString());
        // Para payloads não-JSON, também incluir metadados
        const enrichedPayload = {
          data: payload.toString(),
          siteId,
          officeId,
          topic: incomingTopic,
        };
        broadcastTelemetry(enrichedPayload);
      }
      return;
    }

    // Handle reported messages (device state)
    if (incomingTopic.endsWith("/reported")) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log(`[MQTT] Reported state received from ${siteId}/${officeId}:`, parsed);

        // Atualizar device_reported no banco
        await upsertDeviceReported(officeId, {
          samplingIntervalSec: parsed.samplingIntervalSec,
          co2_alert_threshold: parsed.co2_alert_threshold,
        });

        // Comparar com desired e registrar divergências
        const comparison = await compareStates(officeId);
        if (comparison && !comparison.isSynced) {
          console.warn(
            `[Device Twin] State divergence detected for office ${officeId} (${siteId}):`,
            comparison.diff,
          );
        }
      } catch (error) {
        console.error(`[MQTT] Failed to process reported state from ${siteId}/${officeId}:`, error);
      }
      return;
    }

    // Handle desired messages (if device publishes desired state back)
    if (incomingTopic.endsWith("/desired")) {
      try {
        const parsed = JSON.parse(payload.toString());
        console.log(`[MQTT] Desired state received from ${siteId}/${officeId}:`, parsed);

        // Atualizar device_desired no banco (sync from device)
        await upsertDeviceDesired(officeId, {
          samplingIntervalSec: parsed.samplingIntervalSec,
          co2_alert_threshold: parsed.co2_alert_threshold,
        });
      } catch (error) {
        console.error(`[MQTT] Failed to process desired state from ${siteId}/${officeId}:`, error);
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
    mqttClient.unsubscribe(telemetryTopicPattern);
    mqttClient.unsubscribe(reportedTopicPattern);
    mqttClient.unsubscribe(desiredTopicPattern);
    mqttClient.off("connect", handleConnect);
  };
};

export default startTelemetrySubscriber;



