import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role.service';
import { RoleTcpController } from './role.controller';
import { Role } from './entities/role.entity';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '@config/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtConfig.secret,
        signOptions: { expiresIn: configService.jwtConfig.expiresIn },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [
    RoleTcpController,
  ],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}