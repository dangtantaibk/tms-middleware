import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from '@shared/dto/auth.dto';

@Controller()
export class AuthTcpController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    const result = await this.authService.login(user);
    return {
      success: true,
      data: result,
    };
  }

  @MessagePattern('auth.refresh')
  async refreshToken(@Payload() refreshTokenDto: RefreshTokenDto) {
    try {
      const response = await this.authService.refreshToken(refreshTokenDto.refresh_token);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }
  }

  @MessagePattern('auth.validateUser')
  async validateUser(@Payload() data: { email: string; password: string }) {
    const user = await this.authService.validateUser(data.email, data.password);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    return {
      success: true,
      data: user,
    };
  }

  @MessagePattern('auth.getProfile')
  async getProfile(@Payload() userId: string) {
    try {
      const profile = await this.authService.getProfile(userId);
      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() token: string) {
    try {
      const result = await this.authService.logout(token);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token',
      };
    }
  }
}