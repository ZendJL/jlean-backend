/**
 * LoggingInterceptor — Paso 12.2
 * Log estructurado JSON por cada request HTTP.
 * Formato: { timestamp, method, path, statusCode, durationMs, userId? }
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req       = context.switchToHttp().getRequest();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res        = context.switchToHttp().getResponse();
          const durationMs = Date.now() - startedAt;
          this.logger.log(
            JSON.stringify({
              timestamp:  new Date().toISOString(),
              method:     req.method,
              path:       req.url,
              statusCode: res.statusCode,
              durationMs,
              userId:     req.user?.id ?? null,
            }),
          );
        },
        error: (err) => {
          const durationMs = Date.now() - startedAt;
          this.logger.error(
            JSON.stringify({
              timestamp:  new Date().toISOString(),
              method:     req.method,
              path:       req.url,
              statusCode: err?.status ?? 500,
              durationMs,
              userId:     req.user?.id ?? null,
              error:      err?.message ?? 'Unknown error',
            }),
          );
        },
      }),
    );
  }
}
