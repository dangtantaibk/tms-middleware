import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3020', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
}));
