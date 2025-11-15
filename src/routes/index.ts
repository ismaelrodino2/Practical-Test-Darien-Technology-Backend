import { Router } from "express";
import taskRoutes from "./taskRoutes";

const router = Router();

router.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

router.use("/tasks", taskRoutes);

export default router;

