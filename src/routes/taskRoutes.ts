import { Router } from "express";
import taskController from "../controllers/taskController";

const taskRoutes = Router();

taskRoutes.get("/", (req, res) => taskController.list(req, res));
taskRoutes.get("/:id", (req, res) => taskController.get(req, res));
taskRoutes.post("/", (req, res) => taskController.create(req, res));
taskRoutes.put("/:id", (req, res) => taskController.update(req, res));
taskRoutes.delete("/:id", (req, res) => taskController.delete(req, res));

export default taskRoutes;

