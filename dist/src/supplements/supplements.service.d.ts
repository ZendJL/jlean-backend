import { PrismaService } from '../prisma/prisma.service';
export declare class SupplementsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        doseAmount: number;
        doseUnit: string;
        frequency: string | null;
        timing: string | null;
        caffeinePerDoseMg: number | null;
        active: boolean;
    }[]>;
    create(userId: string, dto: any): import("@prisma/client").Prisma.Prisma__SupplementClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        doseAmount: number;
        doseUnit: string;
        frequency: string | null;
        timing: string | null;
        caffeinePerDoseMg: number | null;
        active: boolean;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(userId: string, id: string, dto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        doseAmount: number;
        doseUnit: string;
        frequency: string | null;
        timing: string | null;
        caffeinePerDoseMg: number | null;
        active: boolean;
    }>;
    remove(userId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        notes: string | null;
        doseAmount: number;
        doseUnit: string;
        frequency: string | null;
        timing: string | null;
        caffeinePerDoseMg: number | null;
        active: boolean;
    }>;
    logIntake(userId: string, supplementId: string): Promise<{
        supplement: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            notes: string | null;
            doseAmount: number;
            doseUnit: string;
            frequency: string | null;
            timing: string | null;
            caffeinePerDoseMg: number | null;
            active: boolean;
        };
    } & {
        id: string;
        userId: string;
        supplementId: string;
        takenAt: Date;
        notes: string | null;
    }>;
    getTodayLogs(userId: string): import("@prisma/client").Prisma.PrismaPromise<({
        supplement: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            notes: string | null;
            doseAmount: number;
            doseUnit: string;
            frequency: string | null;
            timing: string | null;
            caffeinePerDoseMg: number | null;
            active: boolean;
        };
    } & {
        id: string;
        userId: string;
        supplementId: string;
        takenAt: Date;
        notes: string | null;
    })[]>;
    getCaffeineToday(userId: string): Promise<number>;
}
