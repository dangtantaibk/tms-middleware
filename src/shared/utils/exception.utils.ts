import { RpcException } from '@nestjs/microservices';
import { ERROR_CODES, ERROR_CODE_TO_HTTP } from '@common/constants/error-codes.constants';

interface ErrorDetails {
  [key: string]: any;
}

/**
 * Creates a new RpcException with the specified error code, message, and optional details.
 * 
 * @param {keyof typeof ERROR_CODES} code - The error code from the ERROR_CODES constant.
 * @param {string} message - The error message to be included in the exception.
 * @param {ErrorDetails} [details] - Optional additional details about the error.
 * @returns {RpcException} - A new instance of RpcException with the provided information.
 */
export function createRpcException(
  code: string | keyof typeof ERROR_CODES, 
  message: string, 
  details?: ErrorDetails
): RpcException {
  const errorCode = ERROR_CODES[code];
  return new RpcException({
    code: errorCode,
    message: message,
    details: details || null,
    httpStatus: ERROR_CODE_TO_HTTP[errorCode] || 500
  });
}