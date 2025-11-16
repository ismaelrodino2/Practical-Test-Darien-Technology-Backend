import mqtt, { MqttClient } from "mqtt";
import env from "../../config/env";

let mqttClient: MqttClient | null = null;

const connectClient = (): MqttClient => {
  if (mqttClient) {
    return mqttClient;
  }

  const client = mqtt.connect(env.mqttUrl, {
    reconnectPeriod: 5_000,
    keepalive: 60,
    clean: true,
  });

  client.on("connect", () => {
    console.log(`[MQTT] Connected to ${env.mqttUrl}`);
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Attempting to reconnect...");
  });

  client.on("error", (error) => {
    console.error("[MQTT] Connection error:", error.message);
  });

  client.on("close", () => {
    console.warn("[MQTT] Connection closed");
  });

  mqttClient = client;
  return client;
};

export const getMqttClient = (): MqttClient => connectClient();

export default getMqttClient();


