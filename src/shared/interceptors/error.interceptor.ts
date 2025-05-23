import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        
        // Log the error for internal tracking
        console.error('Unhandled error:', error);
        
        // Return a standardized error response
        return throwError(() => new HttpException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        }, HttpStatus.INTERNAL_SERVER_ERROR));
      }),
    );
  }
}
