import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TcpClientService } from './tcp.service';
import { AppConfigService } from '@config/config.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TCP_CLIENT',
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.tcpConfig.host,
            port: configService.tcpConfig.port,
          },
        }),
        inject: [AppConfigService],
      },
    ]),
  ],
  providers: [TcpClientService],
  exports: [TcpClientService],
})
export class TcpClientModule {}