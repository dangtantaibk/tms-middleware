import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);
      return result || null;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.cacheManager.set(key, value, ttl);
      } else {
        await this.cacheManager.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
      // Don't throw error, just log it
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`);
      // Don't throw error, just log it
    }
  }

  async reset(): Promise<void> {
    try {
      if (typeof this.cacheManager.clear === 'function') {
        await this.cacheManager.clear();
      } else if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else {
        this.logger.warn('Cache reset/clear method not available');
      }
    } catch (error) {
      this.logger.warn(`Cache reset error: ${error.message}`);
      // Don't throw error, just log it
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      // Check if store exists and has keys method
      const store = (this.cacheManager as any).store;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(pattern);
        return Array.isArray(keys) ? keys : [];
      }
      
      // Alternative approach for Redis store
      if (store && store.getClient && typeof store.getClient === 'function') {
        const client = store.getClient();
        if (client && typeof client.keys === 'function') {
          const keys = await client.keys(pattern);
          return Array.isArray(keys) ? keys : [];
        }
      }
      
      this.logger.warn(`Keys method not available for pattern ${pattern}`);
      return [];
    } catch (error) {
      this.logger.warn(`Cache keys error for pattern ${pattern}: ${error.message}`);
      return [];
    }
  }

  async clearByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys && keys.length > 0) {
        // Process keys in batches to avoid overwhelming the cache
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(batch.map(key => this.del(key)));
        }
        this.logger.log(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Cache clear by pattern error for ${pattern}: ${error.message}`);
    }
  }

  /**
   * Check if cache is available and working
   */
  async isHealthy(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      const testValue = 'ok';
      
      await this.set(testKey, testValue, 5); // 5 seconds TTL
      const result = await this.get(testKey);
      await this.del(testKey); // Clean up
      
      return result === testValue;
    } catch (error) {
      this.logger.warn(`Cache health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get cache statistics if available
   */
  async getStats(): Promise<any> {
    try {
      const store = (this.cacheManager as any).store;
      if (store && typeof store.getStats === 'function') {
        return await store.getStats();
      }
      
      // For Redis store
      if (store && store.getClient && typeof store.getClient === 'function') {
        const client = store.getClient();
        if (client && typeof client.info === 'function') {
          return await client.info('memory');
        }
      }
      
      return { message: 'Stats not available for this cache store' };
    } catch (error) {
      this.logger.warn(`Cache stats error: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Flush all cache data
   */
  async flushAll(): Promise<void> {
    try {
      const store = (this.cacheManager as any).store;
      
      // Try different methods to flush cache
      if (store && typeof store.flushAll === 'function') {
        await store.flushAll();
      } else if (store && store.getClient && typeof store.getClient === 'function') {
        const client = store.getClient();
        if (client && typeof client.flushAll === 'function') {
          await client.flushAll();
        }
      } else if (typeof this.cacheManager.clear === 'function') {
        await this.cacheManager.clear();
      } else {
        this.logger.warn('Flush all method not available');
      }
      
      this.logger.log('Cache flushed successfully');
    } catch (error) {
      this.logger.warn(`Cache flush error: ${error.message}`);
    }
  }
}