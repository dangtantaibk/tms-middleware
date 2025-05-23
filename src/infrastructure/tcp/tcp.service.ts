import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class TcpClientService {
  private readonly logger = new Logger(TcpClientService.name);

  constructor(
    @Inject('TCP_CLIENT') private readonly tcpClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // Connect to TCP microservice
    await this.tcpClient.connect();
  }

  async onModuleDestroy() {
    // Close TCP connection
    await this.tcpClient.close();
  }

  async send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
  ): Promise<TResult> {
    try {
      this.logger.debug(`Sending message with pattern: ${pattern}`);
      const response = this.tcpClient.send<TResult, TInput>(pattern, data)
        .pipe(timeout(5000)); // 5 second timeout
      
      return await firstValueFrom(response);
    } catch (error) {
      this.logger.error(`Error sending message with pattern ${pattern}: ${error.message}`);
      throw error;
    }
  }

  emit<TInput = any>(pattern: string, data: TInput): Observable<any> {
    try {
      this.logger.debug(`Emitting event with pattern: ${pattern}`);
      return this.tcpClient.emit<any, TInput>(pattern, data);
    } catch (error) {
      this.logger.error(`Error emitting event with pattern ${pattern}: ${error.message}`);
      throw error;
    }
  }
}