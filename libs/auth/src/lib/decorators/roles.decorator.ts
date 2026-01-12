import { SetMetadata } from '@nestjs/common';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

