export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  organizationId: string;
  createdById: string;
  assignedToId?: string; // Optional - task might not be assigned
  createdAt: Date;
  updatedAt: Date;
}
