import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { HealthTcpController } from './health.tcp.controller';
import { HealthService } from './health.service';

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthController, HealthTcpController],
  providers: [HealthService],
})
export class HealthModule {}