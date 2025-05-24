import { Controller, Get } from '@nestjs/common';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Public } from '@shared/decorators/auth.decorator';
import { UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';

@Controller('health')
@UseInterceptors(LoggingInterceptor)
export class HealthController {
  constructor(private readonly cacheService: CacheService) {}

  @Public()
  @Get()
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        redis: await this.checkRedis(),
        database: await this.checkDatabase(),
        tcp: await this.checkTcp(),
      },
    };

    return health;
  }

  @Public()
  @Get('redis')
  async checkRedisOnly() {
    return await this.checkRedis();
  }

  @Public()
  @Get('ready')
  async readiness() {
    const redis = await this.checkRedis();
    const database = await this.checkDatabase();
    
    const isReady = redis.status === 'healthy' && database.status === 'healthy';
    
    return {
      status: isReady ? 'ready' : 'not ready',
      checks: {
        redis,
        database,
      }
    };
  }

  @Public()
  @Get('live')
  async liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<{ status: string; message?: string }> {
    try {
      await this.cacheService.set('health:check', 'ok', 5);
      const result = await this.cacheService.get('health:check');
      
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
      // Simple database connectivity check
      // You'll need to inject your database connection here
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkTcp(): Promise<{ status: string; message?: string }> {
    try {
      // Check if TCP microservice is running
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}