import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigService } from '@config/config.service';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (configService: AppConfigService): TypeOrmModuleOptions => ({
            ...configService.databaseConfig,
          } as TypeOrmModuleOptions),
          inject: [AppConfigService],
        }),
      ],
    };
  }
}
