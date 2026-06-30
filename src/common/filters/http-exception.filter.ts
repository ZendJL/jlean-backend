/**
 * HttpExceptionFilter — Paso 1.3 / 12.3
 * Respuesta de error unificada en JSON para todos los endpoints.
 * Formato: { statusCode, error, message, timestamp, path }
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse<Response>();
    const req    = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message ?? 'Internal server error'
        : typeof exceptionResponse === 'string'
        ? exceptionResponse
        : 'Internal server error';

    // Extraer campos extra del response (ej. retryAfterSeconds de rate limit)
    const extra: Record<string, unknown> = {};
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const { message: _m, error: _e, statusCode: _s, ...rest } = exceptionResponse as any;
      Object.assign(extra, rest);
    }

    const body = {
      statusCode: status,
      error:      HttpStatus[status] ?? 'Error',
      message,
      timestamp:  new Date().toISOString(),
      path:       req.url,
      ...extra,
    };

    if (status >= 500) {
      this.logger.error(
        JSON.stringify({
          ...body,
          stack: exception instanceof Error ? exception.stack : undefined,
        }),
      );
    }

    res.status(status).json(body);
  }
}
