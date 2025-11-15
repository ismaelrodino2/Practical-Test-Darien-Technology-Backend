import { TaskInput, TaskStatus } from "../models/taskModel";
import HttpError from "../utils/httpError";

const allowedStatus: TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];

export function validateTaskPayload(payload: Record<string, unknown>): TaskInput {
  if (!payload || typeof payload !== "object") {
    throw new HttpError("Payload inválido.", 400);
  }

  const { title, description, status, dueDate } = payload as Partial<TaskInput>;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new HttpError("O campo 'title' é obrigatório.", 422);
  }

  if (status && !allowedStatus.includes(status)) {
    throw new HttpError(
      `Status inválido. Utilize: ${allowedStatus.join(", ")}.`,
      422,
    );
  }

  if (dueDate && Number.isNaN(Date.parse(String(dueDate)))) {
    throw new HttpError("Formato de 'dueDate' inválido.", 422);
  }

  return {
    title: title.trim(),
    description: description?.trim(),
    status,
    dueDate,
  };
}

