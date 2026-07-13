import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service';
export type OffQuality = 'COMPLETE' | 'PARTIAL' | 'UNVERIFIED' | 'CONFLICTED';
export interface OffFood {
    barcode: string;
    name: string;
    brand?: string;
    servingSizeG: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
    qualityStatus: OffQuality;
}
export declare class OffClient {
    private monitor;
    private readonly logger;
    constructor(monitor: ExternalApiMonitorService);
    getByBarcode(barcode: string): Promise<OffFood | null>;
    search(query: string, page?: number, pageSize?: number): Promise<OffFood[]>;
    private normalizeProduct;
    evaluateQuality(nutriments: Record<string, number>, productName: string): OffQuality;
}
