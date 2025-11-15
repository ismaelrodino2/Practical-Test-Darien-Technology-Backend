import { Router } from "express";
import spaceRoutes from "./spaceRoutes";
import reservationRoutes from "./reservationRoutes";
import locationRoutes from "./locationRoutes";

const router: import("express").Router = Router();

router.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

router.use("/spaces", spaceRoutes);
router.use("/reservations", reservationRoutes);
router.use("/locations", locationRoutes);

export default router;

