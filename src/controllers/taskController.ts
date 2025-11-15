import { Request, Response } from "express";
import taskService from "../services/taskService";
import { validateTaskPayload } from "../validators/taskValidator";

export class TaskController {
  async list(_req: Request, res: Response): Promise<Response> {
    const tasks = await taskService.list();
    return res.json(tasks);
  }

  async get(req: Request, res: Response): Promise<Response> {
    const task = await taskService.getById(req.params.id);
    return res.json(task);
  }

  async create(req: Request, res: Response): Promise<Response> {
    const payload = validateTaskPayload(req.body);
    const task = await taskService.create(payload);
    return res.status(201).json(task);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const payload = validateTaskPayload(req.body);
    const task = await taskService.update(req.params.id, payload);
    return res.json(task);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    await taskService.delete(req.params.id);
    return res.status(204).send();
  }
}

export default new TaskController();

