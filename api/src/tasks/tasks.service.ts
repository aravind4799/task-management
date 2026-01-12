import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { Role, TaskStatus } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    // Verify user's organization exists
    const org = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    // Create task
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: createTaskDto.status || TaskStatus.TODO,
      organizationId: user.organizationId,
      createdById: user.id,
    });

    const savedTask = await this.taskRepository.save(task);

    // Audit log
    await this.logAction(
      user.id,
      'CREATE_TASK',
      'task',
      savedTask.id,
      { title: savedTask.title, category: savedTask.category },
    );

    return savedTask;
  }

  async findAll(user: User): Promise<Task[]> {
    // Get user's organization
    const org = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!org) {
      return [];
    }

    // Viewer can only see their org's tasks
    if (user.role === Role.VIEWER) {
      return this.taskRepository.find({
        where: { organizationId: user.organizationId },
        relations: ['createdBy', 'assignedTo', 'organization'],
        order: { createdAt: 'DESC' },
      });
    }

    // Admin/Owner can see their org and parent org's tasks
    const orgIds = [user.organizationId];
    if (org.parentId) {
      orgIds.push(org.parentId);
    }

    return this.taskRepository.find({
      where: { organizationId: In(orgIds) },
      relations: ['createdBy', 'assignedTo', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    if (!(await this.canAccessTask(task, user))) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check if user can modify
    if (!(await this.canModifyTask(task, user))) {
      throw new ForbiddenException('Cannot modify this task');
    }

    // Update task
    Object.assign(task, updateTaskDto);
    const updated = await this.taskRepository.save(task);

    // Audit log
    await this.logAction(user.id, 'UPDATE_TASK', 'task', updated.id, updateTaskDto);

    return updated;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    if (!(await this.canModifyTask(task, user))) {
      throw new ForbiddenException('Cannot delete this task');
    }

    await this.taskRepository.remove(task);
    await this.logAction(user.id, 'DELETE_TASK', 'task', id, { title: task.title });
  }

  async getAuditLogs(user: User): Promise<AuditLog[]> {
    // Only Owner/Admin can view audit logs
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only Owner/Admin can view audit logs');
    }

    const org = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!org) {
      return [];
    }

    const orgIds = [user.organizationId];
    if (org.parentId) {
      orgIds.push(org.parentId);
    }

    const scopedUsers = await this.userRepository.find({
      where: { organizationId: In(orgIds) },
      select: ['id'],
    });
    const scopedUserIds = scopedUsers.map(u => u.id);

    const logs = await this.auditLogRepository.find({
      where: scopedUserIds.length ? { userId: In(scopedUserIds) } : {},
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to 100 most recent
    });

    await this.logAction(user.id, 'READ_AUDIT_LOG', 'audit_log', 'all', {
      returned: logs.length,
    });

    return logs;
  }

  // Private helper methods

  private async canAccessTask(task: Task, user: User): Promise<boolean> {
    // Same organization
    if (task.organizationId === user.organizationId) {
      return true;
    }

    // Get user's organization
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!userOrg) {
      return false;
    }

    // Viewer can only see tasks in their own organization
    if (user.role === Role.VIEWER) {
      return false;
    }

    // Admin/Owner can see tasks in parent organization
    // Check if task is in user's parent organization
    if (userOrg.parentId && task.organizationId === userOrg.parentId) {
      return true;
    }

    // Check if task is in a child organization of user's org
    // If task's org has parentId that matches user's org
    const taskOrg = task.organization;
    if (taskOrg && taskOrg.parentId === user.organizationId) {
      return true;
    }

    return false;
  }

  private async canModifyTask(task: Task, user: User): Promise<boolean> {
    // Viewer cannot modify tasks
    if (user.role === Role.VIEWER) {
      return false;
    }

    // Owner/Admin can modify tasks in their organization only
    if (task.organizationId === user.organizationId) {
      return true;
    }

    return false;
  }

  private async logAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any,
  ): Promise<void> {
    const log = this.auditLogRepository.create({
      userId,
      action,
      resourceType,
      resourceId,
      details: JSON.stringify(details),
    });
    await this.auditLogRepository.save(log);
    console.log(`[AUDIT] ${action} by user ${userId} on ${resourceType} ${resourceId}`);
  }
}
