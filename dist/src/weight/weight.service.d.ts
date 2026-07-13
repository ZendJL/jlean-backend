import { PrismaService } from '../prisma/prisma.service';
import { CreateWeightDto } from './dto/create-weight.dto';
export declare class WeightService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, opts: {
        from?: string;
        to?: string;
        limit?: number;
    }): Promise<{
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
    create(userId: string, dto: CreateWeightDto): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    }>;
    remove(userId: string, id: string): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    }>;
    getLast(userId: string): Promise<{
        id: string;
        userId: string;
        weightKg: number;
        note: string | null;
        recordedAt: Date;
    } | null>;
}
