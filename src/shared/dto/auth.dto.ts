import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
}

export class LogoutResponseDto {
  message: string;
}

export class ProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    permissions?: string[];
  }>;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}