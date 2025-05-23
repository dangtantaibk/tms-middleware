import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisCacheModule } from './cache/redis-cache.module';
import { HttpClientModule } from './http/http-client.module';
// import { KafkaModule } from './kafka/kafka.module';
import { TcpClientModule } from './tcp/tcp.module';
import { CacheService } from './cache/cache.service';

@Global()
@Module({
  imports: [
    DatabaseModule.forRoot(),
    RedisCacheModule.forRoot(),
    HttpClientModule,
    // KafkaModule,
    TcpClientModule,
  ],
  providers: [CacheService],
  exports: [
    DatabaseModule,
    RedisCacheModule,
    CacheService,
    HttpClientModule,
    // KafkaModule,
    TcpClientModule,
  ],
})
export class InfrastructureModule {}
