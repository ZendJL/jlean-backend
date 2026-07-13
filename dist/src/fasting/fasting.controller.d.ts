import { FastingService } from './fasting.service';
import { FastingWindowDto } from './dto/fasting-window.dto';
export declare class FastingController {
    private readonly svc;
    constructor(svc: FastingService);
    getConfig(req: any): import("@prisma/client").Prisma.Prisma__FastingConfigClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        active: boolean;
        fastHours: number;
        eatHours: number;
        eatStartHour: number;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    setConfig(req: any, dto: FastingWindowDto): import("@prisma/client").Prisma.Prisma__FastingConfigClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        active: boolean;
        fastHours: number;
        eatHours: number;
        eatStartHour: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getStatus(req: any): Promise<{
        active: boolean;
        fasting: boolean;
        inEatingWindow: boolean;
        windowLabel: string;
        eatStartHour: number;
        eatEndHour: number;
        message: string;
    }>;
}
