import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserTcpController } from './user.tcp.controller';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '@config/config.service';

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
    UserController,
    UserTcpController,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
