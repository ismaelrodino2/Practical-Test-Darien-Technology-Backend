import { Request, Response } from "express";
import {
  listReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../services/reservationService";
import { validateReservationPayload } from "../validators/reservationValidator";

export async function listReservationsHandler(req: Request, res: Response) {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const pageSize = parseInt(String(req.query.pageSize ?? "10"), 10);

  const result = await listReservations({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: Number.isNaN(pageSize) ? 10 : pageSize,
  });

  return res.json(result);
}

export async function getReservationHandler(req: Request, res: Response) {
  const reservation = await getReservationById(req.params.id);
  return res.json(reservation);
}

export async function createReservationHandler(req: Request, res: Response) {
  const payload = validateReservationPayload(req.body);
  const reservation = await createReservation(payload);
  return res.status(201).json(reservation);
}

export async function updateReservationHandler(req: Request, res: Response) {
  const payload = validateReservationPayload(req.body);
  const reservation = await updateReservation(req.params.id, payload);
  return res.json(reservation);
}

export async function deleteReservationHandler(req: Request, res: Response) {
  await deleteReservation(req.params.id);
  return res.status(204).send();
}

