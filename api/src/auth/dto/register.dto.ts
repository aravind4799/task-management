import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsUUID } from 'class-validator';
import { Role } from '@aravindkumar-04f13710-c671-4e9d-b59b-6de0e7d270df/data';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(Role, { message: 'Role must be owner, admin, or viewer' })
  @IsNotEmpty({ message: 'Role is required' })
  role: Role;

  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;
}
