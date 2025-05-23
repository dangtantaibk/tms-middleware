import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@config/config.service';
import { UserService } from '@modules/user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from '@common/constants/cache.constants';
import * as bcrypt from 'bcrypt';
import { LoginDto, RefreshTokenDto } from '@shared/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: AppConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      // Check if the user exists
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        return null;
      }

      if (!user.password || !password) {
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        return null;
      }

      const isMatch = await bcrypt.compare(password, user.password);

      // If the password matches, return the user without the password
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: user.roles?.map(role => role.name) || [],
      permissions: await this.getUserPermissions(user.id)
    };

    const jwtConfig = this.configService.jwtConfig;
    
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: '7d', // 7 days for refresh token
    });

    // Cache the access token
    const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${accessToken}`;
    await this.cacheManager.set(tokenCacheKey, payload, 24 * 60 * 60); // 24 hours

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
      },
    };
  }

  async refreshToken(refreshTokenParam: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshTokenParam, {
        secret: this.configService.jwtConfig.secret
      });
      
      // Get user from the database using payload information
      const user = await this.userService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }
      
      const newPayload = { 
        email: user.email, 
        sub: user.id, 
        roles: user.roles?.map(role => role.name) || [],
        permissions: await this.getUserPermissions(user.id)
      };

      const jwtConfig = this.configService.jwtConfig;
      
      const accessToken = this.jwtService.sign(newPayload, {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.expiresIn,
      });

      const refreshToken = this.jwtService.sign(newPayload, {
        secret: jwtConfig.secret,
        expiresIn: '7d',
      });

      // Cache the new access token
      const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${accessToken}`;
      await this.cacheManager.set(tokenCacheKey, newPayload, 24 * 60 * 60);
      
      return { 
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles?.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
          })) || [],
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    try {
      // Remove token from cache
      const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${token}`;
      await this.cacheManager.del(tokenCacheKey);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userProfile } = user;
    return {
      ...userProfile,
      permissions: await this.getUserPermissions(userId),
    };
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      return await this.userService.getUserPermissions(userId);
    } catch (error) {
      return [];
    }
  }
}