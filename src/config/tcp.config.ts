import { registerAs } from '@nestjs/config';

export default registerAs('tcp', () => ({
  host: process.env.MICROSERVICE_TCP_HOST || '0.0.0.0',
  port: parseInt(process.env.MICROSERVICE_TCP_PORT || '3003', 10),
}));