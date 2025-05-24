import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = request.user?.id || 'anonymous';
    const correlationId = request.headers['x-correlation-id'] || this.generateCorrelationId();

    const startTime = Date.now();
    const isProduction = process.env.NODE_ENV === 'production';

    // LOG: Request started
    if (isProduction) {
      // Production: 
      this.logger.log(
        `[${correlationId}] ${method} ${url} - User: ${userId} - IP: ${ip}`
      );
    } else {
      // Development: more detailed logging
      this.logger.log(
        `📥 [${correlationId}] ${method} ${url} - User: ${userId} - IP: ${ip} - User-Agent: ${userAgent}`
      );
      
      // Log request details chỉ trong development
      if (Object.keys(body || {}).length > 0) {
        const sanitizedBody = this.sanitizeData(body);
        this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
      }
      
      if (Object.keys(query || {}).length > 0) {
        this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
      }
      
      if (Object.keys(params || {}).length > 0) {
        this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
      }
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // LOG: Request completed successfully
        if (isProduction) {
          this.logger.log(
            `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
          );
        } else {
          this.logger.log(
            `📤 [${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
          );
          
          // Log response data chỉ trong development
          if (data) {
            const sanitizedData = this.sanitizeData(data);
            this.logger.debug(`Response: ${JSON.stringify(sanitizedData)}`);
          }
        }

        // WARN: Slow requests (cho cả production và development)
        if (duration > 5000) {
          this.logger.warn(
            `[${correlationId}] SLOW REQUEST - ${method} ${url} - ${duration}ms - User: ${userId}`
          );
        }

        // WARN: Large response size (chỉ warning, không log data)
        if (data && JSON.stringify(data).length > 1000000) { // > 1MB
          this.logger.warn(
            `[${correlationId}] LARGE RESPONSE - ${method} ${url} - Size: ${JSON.stringify(data).length} bytes - User: ${userId}`
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // ERROR: Request failed
        if (isProduction) {
          this.logger.error(
            `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
            error.stack
          );
        } else {
          this.logger.error(
            `❌ [${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
            error.stack
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 
      'token', 
      'refresh_token', 
      'authorization',
      'secret',
      'private_key',
      'api_key'
    ];
    
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    // Recursive sanitization for nested objects
    const sanitizeRecursive = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeRecursive(item));
      }
      
      if (obj && typeof obj === 'object') {
        const result = { ...obj };
        
        for (const field of sensitiveFields) {
          if (result[field]) {
            result[field] = '***HIDDEN***';
          }
        }
        
        // Recursively sanitize nested objects
        for (const key in result) {
          if (result[key] && typeof result[key] === 'object') {
            result[key] = sanitizeRecursive(result[key]);
          }
        }
        
        return result;
      }
      
      return obj;
    };

    return sanitizeRecursive(sanitized);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}