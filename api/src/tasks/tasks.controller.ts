import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions, Permission } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/auth';
import { Roles } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/auth';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard, PermissionGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_TASK)
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permission.READ_TASK)
  findAll(@CurrentUser() user: User) {
    return this.tasksService.findAll(user);
  }

  @Get('audit-log')
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions(Permission.READ_AUDIT_LOG)
  getAuditLogs(@CurrentUser() user: User) {
    return this.tasksService.getAuditLogs(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.READ_TASK)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_TASK)
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_TASK)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user);
  }
}
