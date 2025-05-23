import { registerAs } from '@nestjs/config';

export default registerAs('tcp', () => ({
  host: process.env.TCP_HOST || 'localhost',
  port: parseInt(process.env.TCP_PORT || '3001', 10),
}));