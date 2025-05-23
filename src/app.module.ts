import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrderModule } from './modules/order/order.module';
import { RoleModule } from './modules/role/role.module';
import { HealthModule } from './modules/health/health.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { ErrorInterceptor } from './shared/interceptors/error.interceptor';

@Module({
  imports: [
    ConfigurationModule,
    InfrastructureModule,
    UserModule,
    AuthModule,
    OrderModule,
    RoleModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule {}
