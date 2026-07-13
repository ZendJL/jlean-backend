import { SleepService } from './sleep.service';
import { CreateSleepDto } from './dto/create-sleep.dto';
export declare class SleepController {
    private readonly svc;
    constructor(svc: SleepService);
    findAll(req: any, limit?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        userId: string;
        bedtime: Date;
        wakeTime: Date;
        durationMin: number;
        qualityScore: number | null;
        deepSleepMin: number | null;
        remSleepMin: number | null;
        awakensCount: number | null;
    }[]>;
    create(req: any, dto: CreateSleepDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        bedtime: Date;
        wakeTime: Date;
        durationMin: number;
        qualityScore: number | null;
        deepSleepMin: number | null;
        remSleepMin: number | null;
        awakensCount: number | null;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        bedtime: Date;
        wakeTime: Date;
        durationMin: number;
        qualityScore: number | null;
        deepSleepMin: number | null;
        remSleepMin: number | null;
        awakensCount: number | null;
    }>;
    getLast(req: any): Promise<{
        hoursSlept: number;
        recommendation: string;
        id: string;
        createdAt: Date;
        userId: string;
        bedtime: Date;
        wakeTime: Date;
        durationMin: number;
        qualityScore: number | null;
        deepSleepMin: number | null;
        remSleepMin: number | null;
        awakensCount: number | null;
    } | null>;
}
