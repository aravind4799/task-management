import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService, CreateTaskRequest, UpdateTaskRequest } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: ['todo', Validators.required],
      category: ['work', Validators.required],
      assignedToId: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.taskId = id;
      this.loadTask(id);
    }
  }

  loadTask(id: string): void {
    this.loading = true;
    this.taskService.getTask(id).subscribe({
      next: (task) => {
        this.taskForm.patchValue({
          title: task.title,
          description: task.description,
          status: task.status,
          category: task.category,
          assignedToId: task.assignedToId || '',
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load task';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.loading = true;
      this.error = null;

      if (this.isEditMode && this.taskId) {
        const formValue = this.taskForm.value;
        const updateData: UpdateTaskRequest = {
          ...formValue,
          assignedToId: formValue.assignedToId?.trim() || undefined,
        };
        
        this.taskService.updateTask(this.taskId, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/tasks']);
          },
          error: (err) => {
            console.error('Update error:', err);
            this.error = err.error?.message || 'Failed to update task';
            this.loading = false;
          },
        });
      } else {
        const formValue = this.taskForm.value;
        const createData: CreateTaskRequest = {
          ...formValue,
          assignedToId: formValue.assignedToId?.trim() || undefined,
        };
        
        this.taskService.createTask(createData).subscribe({
          next: (result) => {
            console.log('Task created successfully:', result);
            this.loading = false;
            // Navigate to tasks page
            this.router.navigate(['/tasks']).then(() => {
              console.log('Navigation to /tasks completed');
            });
          },
          error: (err) => {
            console.error('Create error:', err);
            this.error = err.error?.message || 'Failed to create task';
            this.loading = false;
          },
        });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/tasks']);
  }
}

