"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('ExceptionFilter');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof common_1.HttpException ? exception.getResponse() : null;
        const message = typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? exceptionResponse.message ?? 'Internal server error'
            : typeof exceptionResponse === 'string'
                ? exceptionResponse
                : 'Internal server error';
        const extra = {};
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const { message: _m, error: _e, statusCode: _s, ...rest } = exceptionResponse;
            Object.assign(extra, rest);
        }
        const body = {
            statusCode: status,
            error: common_1.HttpStatus[status] ?? 'Error',
            message,
            timestamp: new Date().toISOString(),
            path: req.url,
            ...extra,
        };
        if (status >= 500) {
            this.logger.error(JSON.stringify({
                ...body,
                stack: exception instanceof Error ? exception.stack : undefined,
            }));
        }
        res.status(status).json(body);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map