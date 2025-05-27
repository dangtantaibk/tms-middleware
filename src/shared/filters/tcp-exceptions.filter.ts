import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

@Catch()
export class TcpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TcpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    this.logger.error(`Exception caught: ${exception.message}`, exception.stack);
    
    let error = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: null
    };
    
    if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      error = {
        code: rpcError['code'] || 'RPC_ERROR',
        message: typeof rpcError === 'string' ? rpcError : rpcError['message'],
        details: rpcError['details'] || null
      };
    } else if (exception.name === 'EntityNotFound') {
      error = {
        code: 'ENTITY_NOT_FOUND',
        message: exception.message,
        details: null
      };
    }
    
    return throwError(() => ({
      success: false,
      error
    }));
  }
}