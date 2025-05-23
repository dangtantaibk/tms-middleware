import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  UnauthorizedException, 
  Logger,
  Req,
  UseInterceptors 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, AuthResponseDto, LogoutResponseDto, ProfileResponseDto } from '@shared/dto/auth.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/auth.decorator';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { Request } from 'express';

@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    const { email, password } = loginDto;
    
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await this.authService.login(user);
    this.logger.log(`Successful login for email: ${email}`);
    
    return result;
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Token refresh attempt');
    
    try {
      const response = await this.authService.refreshToken(refreshTokenDto.refresh_token);
      this.logger.log('Token refresh successful');
      return response;
    } catch (error) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() request: Request): Promise<LogoutResponseDto> {
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    this.logger.log('Logout attempt');
    const result = await this.authService.logout(token);
    this.logger.log('Logout successful');
    
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any): Promise<ProfileResponseDto> {
    this.logger.log(`Profile request for user: ${user.email}`);
    return await this.authService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@CurrentUser() user: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: {
        id: user.sub,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}