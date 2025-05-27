import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { HealthTcpController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthTcpController],
  providers: [HealthService],
})
export class HealthModule {}