import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from '@shared/dto/auth.dto';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';
import { BaseResponse } from '@shared/interfaces/response.interface';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { User } from '../user/entities/user.entity';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export interface LogoutResponse {
  message: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: {
    id: string;
    name: string;
    description: string;
  }[];
  permissions: string[];
}

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(TcpExceptionFilter)
export class AuthTcpController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto): Promise<BaseResponse<AuthResponse>> {
    const { email, password } = loginDto;
    
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw createRpcException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials',
        { email }
      );
    }

    const result = await this.authService.login(user);
    return {
      success: true,
      data: result,
      error: null,
    };
  }

  @MessagePattern('auth.refresh')
  async refreshToken(@Payload() refreshTokenDto: RefreshTokenDto): Promise<BaseResponse<AuthResponse>> {
    try {
      const response = await this.authService.refreshToken(refreshTokenDto.refresh_token);
      return {
        success: true,
        data: response,
        error: null,
      };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.UNAUTHORIZED,
        'Invalid or expired refresh token',
        { originalError: error.message }
      );
    }
  }

  @MessagePattern('auth.validateUser')
  async validateUser(@Payload() data: { email: string; password: string }): Promise<BaseResponse<User>> {
    const user = await this.authService.validateUser(data.email, data.password);
    
    if (!user) {
      throw createRpcException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials',
        { email: data.email }
      );
    }

    return {
      success: true,
      data: user,
      error: null,
    };
  }

  @MessagePattern('auth.getProfile')
  async getProfile(@Payload() userId: string): Promise<BaseResponse<UserProfileResponse>> {
    try {
      const profile = await this.authService.getProfile(userId);
      return {
        success: true,
        data: profile,
        error: null,
      };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        'User profile not found',
        { userId, originalError: error.message }
      );
    }
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() token: string): Promise<BaseResponse<LogoutResponse>> {
    try {
      await this.authService.logout(token);
      return {
        success: true,
        data: { message: 'Logged out successfully' },
        error: null,
      };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.BAD_REQUEST,
        'Invalid token',
        { originalError: error.message }
      );
    }
  }
}