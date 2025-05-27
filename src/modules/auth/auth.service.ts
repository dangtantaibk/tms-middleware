import { CACHE_KEYS } from '@common/constants/cache.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { AppConfigService } from '@config/config.service';
import { UserService } from '@modules/user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createRpcException } from '@shared/utils/exception.utils';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { AuthResponse, UserProfileResponse } from './auth.controller';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: AppConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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

  async login(user: any): Promise<AuthResponse> {
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
      expiresIn: jwtConfig.expiresInRefresh,
    });

    // Cache the access token
    const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${accessToken}`;
    await this.cacheManager.set(tokenCacheKey, payload, 24 * 60 * 60); // 24 hours

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.convertExpiryToSeconds(jwtConfig.expiresIn),
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

  async refreshToken(refreshTokenParam: string): Promise<AuthResponse> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshTokenParam, {
        secret: this.configService.jwtConfig.secret
      });

      // Get user from the database using payload information
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw createRpcException(
          ERROR_CODES.UNAUTHORIZED,
          'User not found or inactive',
          { userId: payload.sub }
        );
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
        expiresIn: jwtConfig.expiresInRefresh,
      });

      // Cache the new access token
      const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${accessToken}`;
      await this.cacheManager.set(tokenCacheKey, newPayload, 24 * 60 * 60);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: this.convertExpiryToSeconds(jwtConfig.expiresIn),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles?.map(role => role.name) || [],
        },
      };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.UNAUTHORIZED,
        'Invalid refresh token',
        { originalError: error.message, refreshToken: refreshTokenParam }
      );
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    try {
      // Remove token from cache
      const tokenCacheKey = `${CACHE_KEYS.AUTH_TOKEN}${token}`;
      await this.cacheManager.del(tokenCacheKey);

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Error during logout',
        { originalError: error.message, token }
      );
    }
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    try {
      const user = await this.userService.findById(userId);

      if (!user) {
        throw createRpcException(
          ERROR_CODES.NOT_FOUND,
          `User with ID ${userId} not found`,
          { userId }
        );
      }

      const { password, ...userProfile } = user;

      // Transform roles to the expected format if needed
      const transformedRoles = user.roles?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })) || [];

      return {
        ...userProfile,
        roles: transformedRoles,
        permissions: await this.getUserPermissions(userId),
      };
    } catch (error) {
      // Re-throw if it's already an RpcException
      if (error.name === 'RpcException') {
        throw error;
      }

      // Otherwise, create a new RpcException
      throw createRpcException(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Error fetching user profile',
        { userId, originalError: error.message }
      );
    }
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      return await this.userService.getUserPermissions(userId);
    } catch (error) {
      // Just return empty array on error as before
      return [];
    }
  }

  private convertExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }
}