import { Request, Response } from "express";
import { upsertDeviceDesired } from "../services/deviceService";
import { validateDeviceDesiredPayload } from "../validators/deviceValidator";
import { getMqttClient } from "../integrations/mqtt/mqttClient";

export async function updateDeviceDesiredHandler(
  req: Request,
  res: Response,
) {
  const { officeId } = req.params;
  const { siteId } = req.query;
  const payload = validateDeviceDesiredPayload(req.body);

  // Atualizar no banco
  const deviceDesired = await upsertDeviceDesired(officeId, payload);

  // Publicar no MQTT com retain: true
  // siteId pode vir do query param ou usar padrão
  const site = (typeof siteId === "string" ? siteId : null) || "SITE_A";
  const topic = `sites/${site}/offices/${officeId}/desired`;
  const mqttPayload = {
    samplingIntervalSec: payload.samplingIntervalSec,
    co2_alert_threshold: payload.co2_alert_threshold,
  };

  const mqttClient = getMqttClient();
  mqttClient.publish(
    topic,
    JSON.stringify(mqttPayload),
    { retain: true },
    (error) => {
      if (error) {
        console.error("[MQTT] Failed to publish desired state:", error.message);
      } else {
        console.log(`[MQTT] Published desired state to ${topic}`);
      }
    },
  );

  return res.json(deviceDesired);
}

