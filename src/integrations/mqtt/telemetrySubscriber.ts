import mqttClient from "./mqttClient";
import { broadcastTelemetry } from "../ws/websocketServer";

export const startTelemetrySubscriber = (siteId: string, officeId: string) => {
  const topic = `sites/${siteId}/offices/${officeId}/telemetry`;

  const subscribeToTopic = () => {
    if (!mqttClient.connected) {
      return;
    }

    mqttClient.subscribe(topic, { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Failed to subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${topic}`);
    });
  };

  const handleMessage = (incomingTopic: string, payload: Buffer) => {
    if (incomingTopic !== topic) {
      return;
    }

    try {
      const parsed = JSON.parse(payload.toString());
      console.log("Telemetry received:", parsed);
      broadcastTelemetry(parsed);
    } catch (error) {
      console.log("Telemetry received (raw):", payload.toString());
      broadcastTelemetry(payload.toString());
    }
  };

  const handleConnect = () => subscribeToTopic();

  if (mqttClient.connected) {
    subscribeToTopic();
  }

  mqttClient.on("connect", handleConnect);
  mqttClient.on("message", handleMessage);

  return () => {
    mqttClient.off("message", handleMessage);
    mqttClient.unsubscribe(topic);
    mqttClient.off("connect", handleConnect);
  };
};

export default startTelemetrySubscriber;



