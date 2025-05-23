import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          this.logger.log(
            `[${method}] ${url} ${ip} ${userAgent} ${responseTime}ms`,
          );
        },
        error: (error: any) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          this.logger.error(
            `[${method}] ${url} ${ip} ${userAgent} ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
