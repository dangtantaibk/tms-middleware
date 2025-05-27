import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthTcpController } from './auth.controller';
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
    AuthTcpController,
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}