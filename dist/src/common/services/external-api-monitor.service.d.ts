export type ExternalSource = 'USDA' | 'OFF';
interface CallRecord {
    source: ExternalSource;
    endpoint: string;
    success: boolean;
    statusCode?: number;
    durationMs: number;
    timestamp: string;
    rateLimited: boolean;
}
export declare class ExternalApiMonitorService {
    private readonly logger;
    private readonly records;
    record(entry: Omit<CallRecord, 'timestamp'>): void;
    getSummary(): {
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
}
export {};
