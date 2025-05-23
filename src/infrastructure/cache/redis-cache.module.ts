import { CacheModule } from '@nestjs/cache-manager';
import { DynamicModule, Module, Logger } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { AppConfigService } from '@config/config.service';

@Module({})
export class RedisCacheModule {
  private static readonly logger = new Logger('RedisCacheModule');

  static forRoot(): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async (configService: AppConfigService) => {
            const redisConfig = configService.redisConfig;
            
            this.logger.log(`Attempting to connect to Redis at ${redisConfig.host}:${redisConfig.port}`);
            
            try {
              const store = await redisStore({
                socket: {
                  host: redisConfig.host,
                  port: redisConfig.port,
                  connectTimeout: 30000, // 30 seconds
                  lazyConnect: true, // Don't connect immediately
                  keepAlive: true,
                  reconnectStrategy: (retries) => {
                    this.logger.warn(`Redis connection attempt ${retries}...`);
                    if (retries > 10) {
                      this.logger.error('Redis connection failed after 10 retries, giving up');
                      return false; // Stop retrying
                    }
                    return Math.min(retries * 500, 5000); // Max 5 seconds between retries
                  }
                },
                password: redisConfig.password || undefined,
                ttl: redisConfig.ttl,
                // Error handling
                retry_unfulfilled_commands: true,
                retry_max_delay: 5000,
                retry_delay_on_failover: 500,
                enable_offline_queue: false,
              });

              // Handle Redis events
              const redisClient = store.getClient();
              
              redisClient.on('connect', () => {
                this.logger.log('Redis client connected');
              });

              redisClient.on('ready', () => {
                this.logger.log('Redis client ready');
              });

              redisClient.on('error', (err) => {
                this.logger.error(`Redis client error: ${err.message}`);
              });

              redisClient.on('close', () => {
                this.logger.warn('Redis client connection closed');
              });

              redisClient.on('reconnecting', () => {
                this.logger.log('Redis client reconnecting...');
              });

              redisClient.on('end', () => {
                this.logger.warn('Redis client connection ended');
              });
              
              this.logger.log('Redis store configured successfully');
              return { 
                store,
                ttl: redisConfig.ttl 
              };
              
            } catch (error) {
              this.logger.error(`Failed to connect to Redis: ${error.message}`);
              this.logger.warn('Falling back to memory cache');
              
              // Fallback to in-memory cache
              return {
                ttl: redisConfig.ttl,
                max: 1000, // Maximum number of items in cache
              };
            }
          },
          inject: [AppConfigService],
        }),
      ],
      exports: [CacheModule],
    };
  }
}