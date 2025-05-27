import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-middleware-secret',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
  expiresInRefresh: process.env.JWT_EXPIRATION_REFRESH || '7d',
}));
