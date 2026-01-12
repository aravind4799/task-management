import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Role, TaskStatus, TaskCategory } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let organizationRepository: Repository<Organization>;
  let auditLogRepository: Repository<AuditLog>;
  let userRepository: Repository<User>;

  const mockOwner: User = {
    id: 'owner-123',
    email: 'owner@example.com',
    password: 'hashed',
    role: Role.OWNER,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockAdmin: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    password: 'hashed',
    role: Role.ADMIN,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockViewer: User = {
    id: 'viewer-123',
    email: 'viewer@example.com',
    password: 'hashed',
    role: Role.VIEWER,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Test Organization',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Organization;

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    organizationId: 'org-123',
    createdById: 'owner-123',
    assignedToId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task for an owner', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        category: TaskCategory.WORK,
      };

      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockTaskRepository.create.mockReturnValue({
        ...createTaskDto,
        status: TaskStatus.TODO,
        organizationId: mockOwner.organizationId,
        createdById: mockOwner.id,
      });
      mockTaskRepository.save.mockResolvedValue({
        id: 'new-task-123',
        ...createTaskDto,
      });
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.create(createTaskDto, mockOwner);

      expect(result).toBeDefined();
      expect(mockOrganizationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOwner.organizationId },
      });
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if organization not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Task',
            description: 'Description',
            category: TaskCategory.WORK,
          },
          mockOwner,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll - RBAC Logic', () => {
    it('should return only org tasks for viewer', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findAll(mockViewer);

      expect(result).toHaveLength(1);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: mockViewer.organizationId },
        relations: ['createdBy', 'assignedTo', 'organization'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return org and parent org tasks for admin', async () => {
      const orgWithParent = { ...mockOrganization, parentId: 'parent-org-123' };
      mockOrganizationRepository.findOne.mockResolvedValue(orgWithParent);
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findAll(mockAdmin);

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: In(['org-123', 'parent-org-123']) },
        relations: ['createdBy', 'assignedTo', 'organization'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return org and parent org tasks for owner', async () => {
      const orgWithParent = { ...mockOrganization, parentId: 'parent-org-123' };
      mockOrganizationRepository.findOne.mockResolvedValue(orgWithParent);
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findAll(mockOwner);

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: In(['org-123', 'parent-org-123']) },
        relations: ['createdBy', 'assignedTo', 'organization'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if organization not found', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(null);

      const result = await service.findAll(mockOwner);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return task if user has access', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);

      const result = await service.findOne('task-123', mockOwner);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockOwner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const taskInDifferentOrg = {
        ...mockTask,
        organizationId: 'different-org',
        organization: { id: 'different-org', parentId: null },
      };
      mockTaskRepository.findOne.mockResolvedValue(taskInDifferentOrg);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);

      await expect(
        service.findOne('task-123', mockViewer),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update task if user is owner/admin in same org', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockTaskRepository.save.mockResolvedValue({
        ...mockTask,
        title: 'Updated Task',
      });
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      const result = await service.update(
        'task-123',
        { title: 'Updated Task' },
        mockOwner,
      );

      expect(result.title).toBe('Updated Task');
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if viewer tries to update', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);

      await expect(
        service.update('task-123', { title: 'Updated' }, mockViewer),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete task if user is owner/admin in same org', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockTaskRepository.remove.mockResolvedValue(mockTask);
      mockAuditLogRepository.create.mockReturnValue({});
      mockAuditLogRepository.save.mockResolvedValue({});

      await service.remove('task-123', mockOwner);

      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if viewer tries to delete', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);

      await expect(service.remove('task-123', mockViewer)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs for owner', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockUserRepository.find.mockResolvedValue([{ id: mockOwner.id }]);
      const mockLogs = [
        {
          id: 'log-123',
          action: 'CREATE_TASK',
          userId: mockOwner.id,
        },
      ];
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs(mockOwner);

      expect(result).toEqual(mockLogs);
    });

    it('should return audit logs for admin', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue(mockOrganization);
      mockUserRepository.find.mockResolvedValue([{ id: mockAdmin.id }]);
      const mockLogs = [
        {
          id: 'log-123',
          action: 'CREATE_TASK',
          userId: mockAdmin.id,
        },
      ];
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs(mockAdmin);

      expect(result).toEqual(mockLogs);
    });

    it('should throw ForbiddenException for viewer', async () => {
      await expect(service.getAuditLogs(mockViewer)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
