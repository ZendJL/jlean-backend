import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Usar logger de NestJS (JSON-ready en producción)
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // Global pipes — validación DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:               true,
      forbidNonWhitelisted:    true,
      transform:               true,
      transformOptions:        { enableImplicitConversion: true },
    }),
  );

  // Global interceptor — log estructurado por request
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global filter — respuesta de error unificada JSON
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`JLean backend running on port ${port}`);
}
bootstrap();
