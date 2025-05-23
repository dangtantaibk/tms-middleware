import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3500', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  tmsBackendUrl: process.env.TMS_BACKEND_URL || 'http://localhost:3000',
}));
