import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  get nodeEnv(): string {
    return this.configService.get<string>('app.nodeEnv');
  }

  get port(): number {
    return this.configService.get<number>('app.port');
  }

  get apiPrefix(): string {
    return this.configService.get<string>('app.apiPrefix');
  }

  get tmsBackendUrl(): string {
    return this.configService.get<string>('app.tmsBackendUrl');
  }

  get databaseConfig() {
    return {
      type: this.configService.get<string>('database.type'),
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
      entities: this.configService.get<string[]>('database.entities'),
      synchronize: this.configService.get<boolean>('database.synchronize'),
    };
  }

  get redisConfig() {
    return {
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
      ttl: this.configService.get<number>('redis.ttl'),
    };
  }

  get jwtConfig() {
    return {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  get tcpConfig() {
    return {
      host: this.configService.get<string>('tcp.host'),
      port: this.configService.get<number>('tcp.port'),
    };
  }
}
