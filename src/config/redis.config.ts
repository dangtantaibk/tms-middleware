import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 10,
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 1000,
}));