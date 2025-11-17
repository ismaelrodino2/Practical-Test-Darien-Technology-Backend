import { Request, Response } from "express";
import {
  upsertDeviceDesired,
  getDeviceDesired,
  getDeviceReported,
  publishDesiredToMQTT,
} from "../services/deviceService";
import { validateDeviceDesiredPayload } from "../validators/deviceValidator";

export async function getDeviceDesiredHandler(req: Request, res: Response) {
  const { officeId } = req.params;
  const desired = await getDeviceDesired(officeId);

  if (!desired) {
    return res.status(404).json({ error: "Desired configuration not found" });
  }

  return res.json(desired);
}

export async function getDeviceReportedHandler(req: Request, res: Response) {
  const { officeId } = req.params;
  const reported = await getDeviceReported(officeId);

  if (!reported) {
    return res.status(404).json({ error: "Reported state not found" });
  }

  return res.json(reported);
}

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
  const site = (typeof siteId === "string" ? siteId : null) || "SITE_A";
  try {
    await publishDesiredToMQTT(officeId, site, payload);
  } catch (error) {
    // Log error but don't fail the request
    console.error("[MQTT] Failed to publish desired state:", error);
  }

  return res.json(deviceDesired);
}

