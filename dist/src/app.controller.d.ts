import { AppService } from './app.service';
import { ExternalApiMonitorService } from './common/services/external-api-monitor.service';
export declare class AppController {
    private readonly appService;
    private readonly monitor;
    constructor(appService: AppService, monitor: ExternalApiMonitorService);
    getHello(): string;
    health(): {
        status: string;
        timestamp: string;
        externalApis: {
            window: string;
            USDA: {
                total: number;
                success: number;
                rateLimited: number;
                errors: number;
                avgMs: number;
            };
            OFF: {
                total: number;
                success: number;
                rateLimited: number;
                errors: number;
                avgMs: number;
            };
        };
    };
}
