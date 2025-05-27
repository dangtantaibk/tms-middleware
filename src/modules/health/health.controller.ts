import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { HealthService } from './health.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';
import { BaseResponse } from '@shared/interfaces/response.interface';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

export interface HealthCheckResult {
  status: string;
  timestamp: string;
  [key: string]: any;
}

export interface DetailedHealthResult {
  status: string;
  services: {
    database: { status: string; message?: string };
    redis: { status: string; message?: string };
    [key: string]: any;
  };
  timestamp: string;
}

export interface ReadinessResult {
  status: string;
  checks: {
    redis: { status: string; message?: string };
    database: { status: string; message?: string };
  };
  timestamp: string;
}

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(TcpExceptionFilter)
export class HealthTcpController {
  constructor(
    private readonly healthService: HealthService,
    private readonly cacheService: CacheService
  ) {}

  @MessagePattern('health.check')
  async check(): Promise<BaseResponse<HealthCheckResult>> {
    const result = await this.healthService.check();
    return {
      success: true,
      data: result,
      error: null,
    };
  }

  @MessagePattern('health.detailed')
  async getDetailedHealth(): Promise<BaseResponse<DetailedHealthResult>> {
    const result = await this.healthService.getDetailedHealth();
    return {
      success: true,
      data: result,
      error: null,
    };
  }

  @MessagePattern('health.redis')
  async checkRedisOnly(): Promise<BaseResponse<HealthCheckResult>> {
    try {
      const testKey = 'health:check';
      await this.cacheService.set(testKey, 'test', 10);
      const result = await this.cacheService.get(testKey);
      
      return {
        success: true,
        data: {
          status: result === 'test' ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        },
        error: null,
      };
    } catch (error) {
      throw createRpcException(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Redis service is unavailable',
        { message: error.message }
      );
    }
  }

  @MessagePattern('health.readiness')
  async readiness(): Promise<BaseResponse<ReadinessResult>> {
    const redisCheck = await this.checkRedis();
    const databaseCheck = await this.checkDatabase();
    
    const isReady = redisCheck.status === 'healthy' && databaseCheck.status === 'healthy';
    
    return {
      success: true,
      data: {
        status: isReady ? 'ready' : 'not ready',
        checks: {
          redis: redisCheck,
          database: databaseCheck
        },
        timestamp: new Date().toISOString()
      },
      error: null,
    };
  }

  @MessagePattern('health.liveness')
  async liveness(): Promise<BaseResponse<HealthCheckResult>> {
    return {
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString()
      },
      error: null,
    };
  }

  private async checkRedis(): Promise<{ status: string; message?: string }> {
    try {
      const testKey = 'health:check';
      await this.cacheService.set(testKey, 'ok', 5);
      const result = await this.cacheService.get(testKey);
      
      if (result === 'ok') {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', message: 'Redis not responding correctly' };
      }
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      // Assume health service has a method to check database
      const dbStatus = await this.healthService.checkDatabase();
      return { 
        status: dbStatus.status === 'ok' ? 'healthy' : 'unhealthy',
        message: dbStatus.message
      };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}