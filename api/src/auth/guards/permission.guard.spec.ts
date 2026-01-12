import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { Permission } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/auth';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no permissions are required', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.VIEWER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow owner to create tasks', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.OWNER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.CREATE_TASK]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow admin to create tasks', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.ADMIN },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.CREATE_TASK]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny viewer from creating tasks', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.VIEWER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.CREATE_TASK]);

    const result = guard.canActivate(mockContext);
    
    expect(result).toBe(false);
  });

  it('should allow viewer to read tasks', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.VIEWER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.READ_TASK]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny viewer from reading audit logs', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.VIEWER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.READ_AUDIT_LOG]);

    const result = guard.canActivate(mockContext);
    
    expect(result).toBe(false);
  });

  it('should allow owner to read audit logs', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: Role.OWNER },
        }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.READ_AUDIT_LOG]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });
});
