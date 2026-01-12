import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/auth';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Role hierarchy: Owner (3) > Admin (2) > Viewer (1)
    const roleHierarchy = {
      [Role.OWNER]: 3,
      [Role.ADMIN]: 2,
      [Role.VIEWER]: 1,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = Math.max(...requiredRoles.map(r => roleHierarchy[r]));

    return userRoleLevel >= requiredRoleLevel;
  }
}
