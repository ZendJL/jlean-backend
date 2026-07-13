"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const startedAt = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const res = context.switchToHttp().getResponse();
                const durationMs = Date.now() - startedAt;
                this.logger.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    path: req.url,
                    statusCode: res.statusCode,
                    durationMs,
                    userId: req.user?.id ?? null,
                }));
            },
            error: (err) => {
                const durationMs = Date.now() - startedAt;
                this.logger.error(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    path: req.url,
                    statusCode: err?.status ?? 500,
                    durationMs,
                    userId: req.user?.id ?? null,
                    error: err?.message ?? 'Unknown error',
                }));
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map