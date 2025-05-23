import { UserRole } from '../enums/app.enums';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface IPermission {
  id: string;
  name: string;
  description: string;
}

export interface ITokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface IAuthResponse {
  accessToken: string;
  user: IUser;
}
