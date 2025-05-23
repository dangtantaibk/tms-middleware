import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to response topics
    await this.kafkaClient.connect();
  }

  async send<TResult = any, TInput = any>(
    topic: string,
    message: TInput,
    key?: string,
  ): Promise<TResult> {
    try {
      this.logger.debug(`Sending message to topic ${topic}`);
      const response = this.kafkaClient.send<TResult, TInput>(topic, message);
      return await firstValueFrom(response);
    } catch (error) {
      this.logger.error(`Error sending message to topic ${topic}: ${error.message}`);
      throw error;
    }
  }

  emit<TInput = any>(topic: string, message: TInput, key?: string): Observable<any> {
    try {
      this.logger.debug(`Emitting event to topic ${topic}`);
      return this.kafkaClient.emit<any, TInput>(topic, message);
    } catch (error) {
      this.logger.error(`Error emitting event to topic ${topic}: ${error.message}`);
      throw error;
    }
  }
}
