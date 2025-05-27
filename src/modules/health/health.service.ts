import { HttpClientService } from '@infrastructure/http/http-client.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DetailedHealthResult } from './health.controller';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private httpClient: HttpClientService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getDetailedHealth() : Promise<DetailedHealthResult> {
    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkCache(),
        tmsBackend: await this.checkTmsBackend(),
      },
    };

    // Overall status is the worst status of any service
    if (Object.values(result.services).some(service => service.status === 'error')) {
      result.status = 'error';
    } else if (Object.values(result.services).some(service => service.status === 'warning')) {
      result.status = 'warning';
    }

    return result;
  }

  public async checkDatabase() {
    try {
      return { status: 'ok', message: 'Database connection successful' };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return { status: 'error', message: 'Database connection failed' };
    }
  }

  private async checkCache() {
    try {
      const testKey = 'health:check';
      await this.cacheManager.set(testKey, 'test', 10);
      const result = await this.cacheManager.get(testKey);
      if (result !== 'test') {
        return { status: 'warning', message: 'Cache read/write test failed' };
      }
      return { status: 'ok', message: 'Cache connection successful' };
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`);
      return { status: 'error', message: 'Cache connection failed' };
    }
  }

  private async checkTmsBackend() {
    try {
      await this.httpClient.get('/health');
      return { status: 'ok', message: 'TMS backend connection successful' };
    } catch (error) {
      this.logger.warn(`TMS backend health check failed: ${error.message}`);
      return { status: 'warning', message: 'TMS backend connection failed' };
    }
  }
}
