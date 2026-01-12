import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/auth';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Map roles to permissions
    const rolePermissions: Record<Role, Permission[]> = {
      [Role.OWNER]: [
        Permission.CREATE_TASK,
        Permission.READ_TASK,
        Permission.UPDATE_TASK,
        Permission.DELETE_TASK,
        Permission.READ_AUDIT_LOG,
      ],
      [Role.ADMIN]: [
        Permission.CREATE_TASK,
        Permission.READ_TASK,
        Permission.UPDATE_TASK,
        Permission.DELETE_TASK,
        Permission.READ_AUDIT_LOG,
      ],
      [Role.VIEWER]: [Permission.READ_TASK],
    };

    const userPermissions = rolePermissions[user.role] || [];

    // Check if user has all required permissions
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
}
