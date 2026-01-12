import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Role, TaskStatus, TaskCategory } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';
import { User } from '../entities/user.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed',
    role: Role.OWNER,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    organizationId: 'org-123',
    createdById: 'user-123',
    assignedToId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getAuditLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        category: TaskCategory.WORK,
      };

      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all accessible tasks for user', async () => {
      const tasks = [mockTask];
      mockTasksService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(tasks);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single task by id', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-123', mockUser);

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith('task-123', mockUser);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
      };

      const updatedTask = { ...mockTask, title: 'Updated Task' };
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('task-123', updateTaskDto, mockUser);

      expect(result).toEqual(updatedTask);
      expect(tasksService.update).toHaveBeenCalledWith(
        'task-123',
        updateTaskDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      await controller.remove('task-123', mockUser);

      expect(tasksService.remove).toHaveBeenCalledWith('task-123', mockUser);
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs for owner/admin', async () => {
      const mockLogs = [
        {
          id: 'log-123',
          action: 'CREATE_TASK',
          resourceType: 'task',
          resourceId: 'task-123',
          userId: 'user-123',
          details: '{}',
          createdAt: new Date(),
        },
      ];

      mockTasksService.getAuditLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAuditLogs(mockUser);

      expect(result).toEqual(mockLogs);
      expect(tasksService.getAuditLogs).toHaveBeenCalledWith(mockUser);
    });
  });
});
