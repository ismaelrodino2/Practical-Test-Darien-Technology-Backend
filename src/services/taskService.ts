import HttpError from "../utils/httpError";
import {
  Task,
  TaskInput,
  TaskPersistenceInput,
} from "../models/taskModel";
import prisma from "../config/prismaClient";

class TaskService {
  async list(): Promise<Task[]> {
    return prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new HttpError("Tarefa não encontrada.", 404);
    }

    return task;
  }

  async create(payload: TaskInput): Promise<Task> {
    return prisma.task.create({ data: this.normalizeInput(payload) });
  }

  async update(id: string, payload: TaskInput): Promise<Task> {
    await this.getById(id);

    return prisma.task.update({
      where: { id },
      data: this.normalizeInput(payload),
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await prisma.task.delete({ where: { id } });
  }

  private normalizeInput(payload: TaskInput): TaskPersistenceInput {
    return {
      ...payload,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    };
  }
}

export default new TaskService();

