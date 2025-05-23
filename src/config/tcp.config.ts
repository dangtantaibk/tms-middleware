import { registerAs } from '@nestjs/config';

export default registerAs('tcp', () => ({
  host: process.env.MICROSERVICE_TCP_HOST || 'localhost',
  port: parseInt(process.env.MICROSERVICE_TCP_PORT || '3001', 10),
}));