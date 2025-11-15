import { Router } from "express";
import {
  listReservationsHandler,
  getReservationHandler,
  createReservationHandler,
  updateReservationHandler,
  deleteReservationHandler,
} from "../controllers/reservationController";

const reservationRoutes: import("express").Router = Router();

reservationRoutes.get("/", listReservationsHandler);
reservationRoutes.get("/:id", getReservationHandler);
reservationRoutes.post("/", createReservationHandler);
reservationRoutes.put("/:id", updateReservationHandler);
reservationRoutes.delete("/:id", deleteReservationHandler);

export default reservationRoutes;

