export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | string;
}

export type TaskPersistenceInput = Omit<TaskInput, "dueDate"> & {
  dueDate?: Date | null;
};

