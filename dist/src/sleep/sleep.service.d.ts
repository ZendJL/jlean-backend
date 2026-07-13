import { PrismaService } from '../prisma/prisma.service';
export declare class SleepService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, limit?: number): import("@prisma/client").Prisma.PrismaPromise<{
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
    create(userId: string, dto: {
        bedtime: string;
        wakeTime: string;
        qualityScore?: number;
    }): Promise<{
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
    remove(userId: string, id: string): Promise<{
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
    getLast(userId: string): Promise<{
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
