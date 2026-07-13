import { ConfigService } from '@nestjs/config';
import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service';
export interface UsdaFood {
    fdcId: number;
    description: string;
    brandOwner?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
    caffeineMg?: number;
}
export declare class UsdaClient {
    private config;
    private monitor;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: ConfigService, monitor: ExternalApiMonitorService);
    search(query: string, pageSize?: number): Promise<UsdaFood[]>;
    getDetail(fdcId: string): Promise<UsdaFood | null>;
    private fetchWithRateLimit;
    private getNutrientValue;
    private normalizeSearchItem;
    private normalizeDetail;
}
