import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthTcpController } from './auth.tcp.controller';
import { UserModule } from '@modules/user/user.module';
import { AppConfigService } from '@config/config.service';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtConfig.secret,
        signOptions: { 
          expiresIn: configService.jwtConfig.expiresIn 
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [
    AuthController,
    AuthTcpController,
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}