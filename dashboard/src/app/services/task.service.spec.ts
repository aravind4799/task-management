import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService, Task, CreateTaskRequest, UpdateTaskRequest } from './task.service';
import { environment } from '../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

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
    createdBy: {
      id: 'user-123',
      email: 'test@example.com',
    },
    assignedTo: null,
    organization: {
      id: 'org-123',
      name: 'Test Org',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch all tasks', () => {
      const mockTasks = [mockTask];

      service.getTasks().subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks[0]).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('getTask', () => {
    it('should fetch a single task by id', () => {
      service.getTask('task-123').subscribe((task) => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        description: 'New Description',
        category: 'work',
      };

      service.createTask(createRequest).subscribe((task) => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockTask);
    });

    it('should handle creation with optional fields', () => {
      const createRequest: CreateTaskRequest = {
        title: 'New Task',
        description: 'New Description',
        status: 'in_progress',
        category: 'personal',
        assignedToId: 'user-456',
      };

      service.createTask(createRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.body.status).toBe('in_progress');
      expect(req.request.body.assignedToId).toBe('user-456');
      req.flush(mockTask);
    });
  });

  describe('updateTask', () => {
    it('should update a task', () => {
      const updateRequest: UpdateTaskRequest = {
        title: 'Updated Task',
        status: 'done',
      };

      service.updateTask('task-123', updateRequest).subscribe((task) => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', () => {
      service.deleteTask('task-123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/task-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs', () => {
      const mockLogs = [
        {
          id: 'log-123',
          action: 'CREATE_TASK',
          resourceType: 'task',
          resourceId: 'task-123',
          userId: 'user-123',
          details: '{}',
          createdAt: new Date(),
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
      ];

      service.getAuditLogs().subscribe((logs) => {
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('CREATE_TASK');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/audit-log`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLogs);
    });
  });
});
