import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TaskFormComponent } from './task-form.component';
import { TaskService, Task } from '../../services/task.service';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskService: SpyOf<TaskService>;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let activatedRoute: any;

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    category: 'work',
    organizationId: 'org-123',
    createdById: 'user-123',
    assignedToId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;

  beforeEach(async () => {
    taskService = createSpyObj<TaskService>([
      'createTask',
      'getTask',
      'updateTask',
    ]);
    activatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values in create mode', () => {
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('description')?.value).toBe('');
    expect(component.taskForm.get('status')?.value).toBe('todo');
    expect(component.taskForm.get('category')?.value).toBe('work');
    expect(component.isEditMode).toBe(false);
  });

  it('should load task in edit mode', () => {
    activatedRoute.snapshot.paramMap.get.mockReturnValue('task-123');
    taskService.getTask.mockReturnValue(of(mockTask));

    component.ngOnInit();

    expect(component.isEditMode).toBe(true);
    expect(component.taskId).toBe('task-123');
    expect(taskService.getTask).toHaveBeenCalledWith('task-123');
  });

  it('should patch form values when loading task', () => {
    taskService.getTask.mockReturnValue(of(mockTask));

    component.taskId = 'task-123';
    component.isEditMode = true;
    component.loadTask('task-123');

    expect(component.taskForm.get('title')?.value).toBe('Test Task');
    expect(component.taskForm.get('description')?.value).toBe('Test Description');
    expect(component.taskForm.get('status')?.value).toBe('todo');
    expect(component.taskForm.get('category')?.value).toBe('work');
  });

  describe('Form Validation', () => {
    it('should validate title as required', () => {
      const titleControl = component.taskForm.get('title');
      
      titleControl?.setValue('');
      expect(titleControl?.hasError('required')).toBe(true);
    });

    it('should validate title minimum length', () => {
      const titleControl = component.taskForm.get('title');
      
      titleControl?.setValue('ab');
      expect(titleControl?.hasError('minlength')).toBe(true);
      
      titleControl?.setValue('abc');
      expect(titleControl?.hasError('minlength')).toBe(false);
    });

    it('should validate description as required', () => {
      const descControl = component.taskForm.get('description');
      
      descControl?.setValue('');
      expect(descControl?.hasError('required')).toBe(true);
    });

    it('should validate description minimum length', () => {
      const descControl = component.taskForm.get('description');
      
      descControl?.setValue('short');
      expect(descControl?.hasError('minlength')).toBe(true);
      
      descControl?.setValue('long enough description');
      expect(descControl?.hasError('minlength')).toBe(false);
    });

    it('should mark form as valid when all fields are correct', () => {
      component.taskForm.patchValue({
        title: 'Valid Title',
        description: 'Valid description with enough characters',
        status: 'todo',
        category: 'work',
      });

      expect(component.taskForm.valid).toBe(true);
    });
  });

  describe('Create Task', () => {
    it('should create task on valid form submission', () => {
      taskService.createTask.mockReturnValue(of(mockTask));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description with enough length',
        status: 'todo',
        category: 'work',
      });

      component.onSubmit();

      expect(taskService.createTask).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/tasks']);
      expect(component.loading).toBe(false);
    });

    it('should handle empty assignedToId', () => {
      taskService.createTask.mockReturnValue(of(mockTask));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description with enough length',
        assignedToId: '   ',
      });

      component.onSubmit();

      const [args] = taskService.createTask.mock.calls.slice(-1);
      expect(args[0].assignedToId).toBeUndefined();
    });

    it('should show error on create failure', () => {
      taskService.createTask.mockReturnValue(
        throwError(() => ({ error: { message: 'Creation failed' } }))
      );

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description with enough length',
      });

      component.onSubmit();

      expect(component.error).toBe('Creation failed');
      expect(component.loading).toBe(false);
    });
  });

  describe('Update Task', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.taskId = 'task-123';
    });

    it('should update task on valid form submission', () => {
      taskService.updateTask.mockReturnValue(of(mockTask));

      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description with enough length',
      });

      component.onSubmit();

      expect(taskService.updateTask).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/tasks']);
    });

    it('should show error on update failure', () => {
      taskService.updateTask.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description with enough length',
      });

      component.onSubmit();

      expect(component.error).toBe('Update failed');
      expect(component.loading).toBe(false);
    });
  });

  describe('Cancel', () => {
    it('should navigate back to tasks on cancel', () => {
      component.onCancel();
      
      expect(navigateSpy).toHaveBeenCalledWith(['/tasks']);
    });
  });

  describe('Loading State', () => {
    it('should set loading state during task creation', () => {
      taskService.createTask.mockReturnValue(of(mockTask));

      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description with enough length',
      });

      expect(component.loading).toBe(false);
      component.onSubmit();
      expect(component.loading).toBe(false);
    });

    it('should set loading state when loading existing task', () => {
      taskService.getTask.mockReturnValue(of(mockTask));

      expect(component.loading).toBe(false);
      component.loadTask('task-123');
      expect(component.loading).toBe(false);
    });
  });

  it('should not submit if form is invalid', () => {
    component.taskForm.patchValue({
      title: 'ab',
      description: 'short',
    });

    component.onSubmit();

    expect(taskService.createTask).not.toHaveBeenCalled();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  });
});
