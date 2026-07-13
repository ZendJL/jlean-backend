import { PrismaService } from '../prisma/prisma.service';
interface FastingConfigDto {
    fastHours: number;
    eatHours: number;
    eatStartHour: number;
    active?: boolean;
}
export declare class FastingService {
    private prisma;
    constructor(prisma: PrismaService);
    getConfig(userId: string): import("@prisma/client").Prisma.Prisma__FastingConfigClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        active: boolean;
        fastHours: number;
        eatHours: number;
        eatStartHour: number;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    setConfig(userId: string, dto: FastingConfigDto): import("@prisma/client").Prisma.Prisma__FastingConfigClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        active: boolean;
        fastHours: number;
        eatHours: number;
        eatStartHour: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getStatus(userId: string): Promise<{
        active: boolean;
        fasting: boolean;
        inEatingWindow: boolean;
        windowLabel: string;
        eatStartHour: number;
        eatEndHour: number;
        message: string;
    }>;
}
export {};
