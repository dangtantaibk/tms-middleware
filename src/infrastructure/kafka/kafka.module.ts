import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
import { AppConfigService } from '@config/config.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'tms-middleware',
              brokers: ['localhost:9092'], // Replace with environment variables later
            },
            consumer: {
              groupId: 'tms-middleware-consumer',
            },
          },
        }),
        inject: [AppConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
