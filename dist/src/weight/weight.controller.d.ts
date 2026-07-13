import { WeightService } from './weight.service';
import { CreateWeightDto } from './dto/create-weight.dto';
export declare class WeightController {
    private readonly svc;
    constructor(svc: WeightService);
    findAll(req: any, from?: string, to?: string, limit?: string): Promise<{
        entries: {
            id: string;
            userId: string;
            weightKg: number;
            note: string | null;
            recordedAt: Date;
        }[];
        stats: null;
    } | {
        entries: {
            id: string;
            userId: string;
            weightKg: number;
            note: string | null;
            recordedAt: Date;
        }[];
        stats: {
            minWeight: number;
            maxWeight: number;
            delta: number;
            count: number;
        };
    }>;
    getLast(req: any): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    } | null>;
    create(req: any, dto: CreateWeightDto): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    }>;
}
