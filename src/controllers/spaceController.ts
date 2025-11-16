import { Request, Response } from "express";
import {
  listSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace,
} from "../services/spaceService";
import { validateSpacePayload } from "../validators/spaceValidator";

export async function listSpacesHandler(_req: Request, res: Response) {
  const spaces = await listSpaces();
  return res.json(spaces);
}

export async function getSpaceHandler(req: Request, res: Response) {
  const space = await getSpaceById(req.params.id);
  return res.json(space);
}

export async function createSpaceHandler(req: Request, res: Response) {
  const payload = validateSpacePayload(req.body);
  const space = await createSpace(payload);
  return res.status(201).json(space);
}

export async function updateSpaceHandler(req: Request, res: Response) {
  const payload = validateSpacePayload(req.body);
  const space = await updateSpace(req.params.id, payload);
  return res.json(space);
}

export async function deleteSpaceHandler(req: Request, res: Response) {
  await deleteSpace(req.params.id);
  return res.status(204).send();
}

