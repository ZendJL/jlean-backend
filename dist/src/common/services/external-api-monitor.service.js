"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiMonitorService = void 0;
const common_1 = require("@nestjs/common");
const MAX_RECORDS = 500;
let ExternalApiMonitorService = class ExternalApiMonitorService {
    logger = new common_1.Logger('ExternalAPI');
    records = [];
    record(entry) {
        const record = { ...entry, timestamp: new Date().toISOString() };
        this.records.push(record);
        if (this.records.length > MAX_RECORDS)
            this.records.shift();
        const level = entry.rateLimited ? 'warn' : entry.success ? 'log' : 'error';
        this.logger[level](JSON.stringify({
            type: 'external_api',
            source: entry.source,
            endpoint: entry.endpoint,
            success: entry.success,
            statusCode: entry.statusCode,
            durationMs: entry.durationMs,
            rateLimited: entry.rateLimited,
        }));
    }
    getSummary() {
        const now = Date.now();
        const last1h = this.records.filter((r) => now - new Date(r.timestamp).getTime() < 60 * 60 * 1000);
        const bySource = (src) => {
            const calls = last1h.filter((r) => r.source === src);
            return {
                total: calls.length,
                success: calls.filter((r) => r.success).length,
                rateLimited: calls.filter((r) => r.rateLimited).length,
                errors: calls.filter((r) => !r.success && !r.rateLimited).length,
                avgMs: calls.length > 0
                    ? Math.round(calls.reduce((s, r) => s + r.durationMs, 0) / calls.length)
                    : 0,
            };
        };
        return {
            window: 'last_1h',
            USDA: bySource('USDA'),
            OFF: bySource('OFF'),
        };
    }
};
exports.ExternalApiMonitorService = ExternalApiMonitorService;
exports.ExternalApiMonitorService = ExternalApiMonitorService = __decorate([
    (0, common_1.Injectable)()
], ExternalApiMonitorService);
//# sourceMappingURL=external-api-monitor.service.js.map