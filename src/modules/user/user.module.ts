import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserTcpController } from './user.controller';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '@config/config.service';
import { APP_FILTER } from '@nestjs/core';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtConfig.secret,
        signOptions: { expiresIn: configService.jwtConfig.expiresIn },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [
    UserTcpController,
  ],
  providers: [
    UserService,
    {
      provide: APP_FILTER,
      useClass: TcpExceptionFilter,
    },
  ],
  exports: [UserService],
})
export class UserModule { }
