import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { HealthService } from './health.service';
import { CacheService } from '@infrastructure/cache/cache.service';

@Controller()
@UseInterceptors(LoggingInterceptor)
export class HealthTcpController {
  constructor(
    private readonly healthService: HealthService,
    private readonly cacheService: CacheService
  ) {}

  @MessagePattern('health.check')
  async check() {
    try {
      return {
        success: true,
        data: await this.healthService.check()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @MessagePattern('health.detailed')
  async getDetailedHealth() {
    try {
      return {
        success: true,
        data: await this.healthService.getDetailedHealth()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @MessagePattern('health.redis')
  async checkRedisOnly() {
    try {
      const testKey = 'health:check';
      await this.cacheService.set(testKey, 'test', 10);
      const result = await this.cacheService.get(testKey);
      
      return {
        success: true,
        data: {
          status: result === 'test' ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @MessagePattern('health.readiness')
  async readiness() {
    try {
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
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @MessagePattern('health.liveness')
  async liveness() {
    return {
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString()
      }
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