import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigService } from './config/config.service';
import * as compression from 'compression';
import helmet from 'helmet';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from '@shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // Set global prefix
  app.setGlobalPrefix(configService.apiPrefix);

  // Enable CORS
  app.enableCors();

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Security middlewares
  app.use(helmet());
  app.use(compression());
  
  if (process.env.NODE_ENV === 'production') {
    app.useLogger(['log', 'warn', 'error']);
  } else {
    app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']); 
  }

  // Global exception filter để log errors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Create TCP Microservice
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.MICROSERVICE_TCP_HOST || '0.0.0.0',
      port: parseInt(process.env.MICROSERVICE_TCP_PORT) || 3003,
    },
  });

  // Start all microservices
  await app.startAllMicroservices();
  logger.log(`🔌 TCP Microservice running on ${process.env.MICROSERVICE_TCP_HOST || '0.0.0.0'}:${process.env.MICROSERVICE_TCP_PORT || 3003}`);

  // Start HTTP server
  const port = configService.port;
  await app.listen(port);
  
  logger.log(`🚀 HTTP Server running on: http://localhost:${port}${configService.apiPrefix}`);
}

bootstrap();