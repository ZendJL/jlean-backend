import { SupplementsService } from './supplements.service';
import { CreateSupplementDto } from './dto/create-supplement.dto';
import { LogSupplementDto } from './dto/log-supplement.dto';
export declare class SupplementsController {
    private readonly svc;
    constructor(svc: SupplementsService);
    findAll(req: any): import("@prisma/client").Prisma.PrismaPromise<{
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
    create(req: any, dto: CreateSupplementDto): import("@prisma/client").Prisma.Prisma__SupplementClient<{
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
    update(req: any, id: string, dto: Partial<CreateSupplementDto>): Promise<{
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
    remove(req: any, id: string): Promise<{
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
    log(req: any, dto: LogSupplementDto): Promise<{
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
    todayLogs(req: any): import("@prisma/client").Prisma.PrismaPromise<({
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
}
