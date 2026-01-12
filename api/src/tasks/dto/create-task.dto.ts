import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus, TaskCategory } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

export class CreateTaskDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsEnum(TaskStatus, { message: 'Status must be todo, in_progress, or done' })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory, { message: 'Category must be work or personal' })
  @IsNotEmpty({ message: 'Category is required' })
  category: TaskCategory;

  @IsUUID('4', { message: 'Assigned to ID must be a valid UUID' })
  @IsOptional()
  assignedToId?: string;
}
