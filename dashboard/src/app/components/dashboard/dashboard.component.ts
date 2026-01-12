import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  private tasksStreamSubscription?: Subscription;

  // Filter and sort properties
  selectedStatus: 'all' | 'todo' | 'in_progress' | 'done' = 'all';
  selectedCategory: 'all' | 'work' | 'personal' = 'all';
  sortBy: 'date' | 'status' | 'category' = 'date';

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Keep local state in sync with the shared task stream
    this.tasksStreamSubscription = this.taskService.tasks$.subscribe((tasks) => {
      this.tasks = tasks;
      // If we receive tasks, clear the loading state
      if (this.loading && tasks.length > 0) {
        this.loading = false;
      }
    });

    // Check if tasks are already loaded (from auth service pre-fetch)
    // If so, don't show loading spinner
    const currentTasks = this.taskService.getCurrentTasks();
    if (currentTasks.length > 0) {
      this.tasks = currentTasks;
      this.loading = false;
    } else {
      // Only show loading if we don't have tasks yet
      this.loadTasks();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.tasksStreamSubscription?.unsubscribe();
  }

  get canViewAuditLog(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner';
  }

  get canManageTasks(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner' || role === 'admin';
  }

  loadTasks(): void {
    this.loading = true;
    this.error = null;
    
    this.taskService.refreshTasks().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      error: (err) => {
        this.error = err.error?.message || 'Failed to load tasks';
      },
    });
  }

  get filteredTasks(): Task[] {
    let filtered = [...this.tasks];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === this.selectedStatus);
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((task) => task.category === this.selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }

  get taskStats() {
    const total = this.tasks.length;
    const todo = this.tasks.filter((t) => t.status === 'todo').length;
    const inProgress = this.tasks.filter((t) => t.status === 'in_progress').length;
    const done = this.tasks.filter((t) => t.status === 'done').length;
    return { total, todo, inProgress, done };
  }

  onDeleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          // Optimistically update local state for instant UI feedback
          this.tasks = this.tasks.filter((t) => t.id !== id);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete task';
        },
      });
    }
  }

  onUpdateStatus(task: Task, newStatus: 'todo' | 'in_progress' | 'done'): void {
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => {
        // Task is automatically updated in the list via BehaviorSubject
        // No need to call loadTasks() again
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update task';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getCategoryClass(category: string): string {
    return category === 'work' 
      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
      : 'bg-purple-100 text-purple-800 border border-purple-200';
  }
}

