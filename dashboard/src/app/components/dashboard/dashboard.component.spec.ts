import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { TaskService, Task } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: SpyOf<AuthService>;
  let taskService: SpyOf<TaskService>;
  let tasksSubject: BehaviorSubject<Task[]>;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'owner',
    organizationId: 'org-123',
  };

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      category: 'work',
      organizationId: 'org-123',
      createdById: 'user-123',
      assignedToId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task,
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'done',
      category: 'personal',
      organizationId: 'org-123',
      createdById: 'user-123',
      assignedToId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task,
  ];

  beforeEach(async () => {
    authService = createSpyObj<AuthService>(['getCurrentUser', 'logout']);
    taskService = createSpyObj<TaskService>(['refreshTasks', 'updateTask', 'deleteTask', 'getCurrentTasks']);
    tasksSubject = new BehaviorSubject<Task[]>(mockTasks);
    (taskService as any).tasks$ = tasksSubject.asObservable();
    (taskService as any).taskUpdated$ = of(undefined);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, CommonModule, FormsModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TaskService, useValue: taskService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

    authService.getCurrentUser.mockReturnValue(mockUser);
    taskService.refreshTasks.mockReturnValue(of(mockTasks));
    taskService.getCurrentTasks.mockReturnValue(mockTasks);

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load current user on init', () => {
    fixture.detectChanges();
    
    expect(component.currentUser).toEqual(mockUser);
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('should load tasks on init', () => {
    fixture.detectChanges();
    
    expect(component.tasks.length).toBe(2);
  });

  it('should calculate task stats correctly', () => {
    fixture.detectChanges();
    
    const stats = component.taskStats;
    expect(stats.total).toBe(2);
    expect(stats.todo).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.inProgress).toBe(0);
  });

  it('should filter tasks by status', () => {
    fixture.detectChanges();
    
    component.selectedStatus = 'todo';
    const filtered = component.filteredTasks;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('todo');
  });

  it('should filter tasks by category', () => {
    fixture.detectChanges();
    
    component.selectedCategory = 'work';
    const filtered = component.filteredTasks;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].category).toBe('work');
  });

  it('should sort tasks by date (newest first)', () => {
    const tasks = [
      { ...mockTasks[0], createdAt: new Date('2024-01-01') },
      { ...mockTasks[1], createdAt: new Date('2024-01-02') },
    ];
    component.tasks = tasks as Task[];
    component.sortBy = 'date';
    
    const sorted = component.filteredTasks;
    
    expect(new Date(sorted[0].createdAt).getTime()).toBeGreaterThan(
      new Date(sorted[1].createdAt).getTime()
    );
  });

  it('should sort tasks by status', () => {
    fixture.detectChanges();
    component.sortBy = 'status';
    
    const sorted = component.filteredTasks;
    
    // todo=1, in_progress=2, done=3
    expect(sorted[0].status).toBe('todo');
    expect(sorted[1].status).toBe('done');
  });

  it('should update task status', () => {
    const updatedTask = { ...mockTasks[0], status: 'done' as const };
    taskService.updateTask.mockReturnValue(of(updatedTask));
    tasksSubject.next([updatedTask, mockTasks[1]]);
    
    fixture.detectChanges();
    
    component.onUpdateStatus(mockTasks[0], 'done');
    
    expect(taskService.updateTask).toHaveBeenCalledWith('task-1', { status: 'done' });
  });

  it('should delete task after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    taskService.deleteTask.mockReturnValue(of(undefined));
    
    fixture.detectChanges();
    
    component.onDeleteTask('task-1');
    
    expect(taskService.deleteTask).toHaveBeenCalledWith('task-1');
    expect(component.tasks.some(t => t.id === 'task-1')).toBe(false);
  });

  it('should not delete task if confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    component.onDeleteTask('task-1');
    
    expect(taskService.deleteTask).not.toHaveBeenCalled();
  });

  it('should handle error when loading tasks fails', () => {
    taskService.getCurrentTasks.mockReturnValue([]);
    tasksSubject.next([]);
    taskService.refreshTasks.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load' } })));
    
    fixture.detectChanges();
    
    expect(component.error).toBe('Failed to load');
    expect(component.loading).toBe(false);
  });

  it('should handle error when updating task fails', () => {
    taskService.updateTask.mockReturnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    
    fixture.detectChanges();
    
    component.onUpdateStatus(mockTasks[0], 'done');
    
    expect(component.error).toBe('Update failed');
  });

  it('should logout and navigate to login', () => {
    component.logout();
    
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('todo')).toContain('gray');
    expect(component.getStatusClass('in_progress')).toContain('yellow');
    expect(component.getStatusClass('done')).toContain('green');
  });

  it('should return correct category class', () => {
    expect(component.getCategoryClass('work')).toContain('blue');
    expect(component.getCategoryClass('personal')).toContain('purple');
  });

  it('should reload tasks when navigating', () => {
    fixture.detectChanges();
    
    const initialCallCount = taskService.refreshTasks.mock.calls.length;
    
    component.loadTasks();
    
    expect(taskService.refreshTasks.mock.calls.length).toBe(initialCallCount + 1);
  });
});
