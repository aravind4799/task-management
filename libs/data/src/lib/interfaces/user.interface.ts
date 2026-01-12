export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export interface IUser {
  id: string;
  email: string;
  password: string; // hashed in database
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
