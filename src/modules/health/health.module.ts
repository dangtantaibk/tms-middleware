import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { HealthTcpController } from './health.tcp.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthController, HealthTcpController],
})
export class HealthModule {}