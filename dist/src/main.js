"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'warn', 'error', 'debug'],
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`JLean backend running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map