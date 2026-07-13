import { PrismaService } from '../prisma/prisma.service';
export interface CreateDayTypeDto {
    name: string;
    tdeAdjustPct: number;
    color?: string;
    isDefault?: boolean;
}
export interface UpdateDayTypeDto {
    name?: string;
    tdeAdjustPct?: number;
    color?: string;
    isDefault?: boolean;
}
export declare const DEFAULT_DAY_TYPES: Omit<CreateDayTypeDto, 'isDefault'>[];
export declare class DayTypesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }[]>;
    create(userId: string, dto: CreateDayTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }>;
    update(userId: string, id: string, dto: UpdateDayTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }>;
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    seedDefaultDayTypes(userId: string): Promise<void>;
    assignToDate(userId: string, dayTypeId: string, date: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        dayTypeId: string;
        date: Date;
    }>;
    removeAssignment(userId: string, date: string): Promise<{
        deleted: boolean;
    }>;
    getAdjustedTargets(userId: string, date: Date): Promise<{
        base: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        dayType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isDefault: boolean;
            tdeAdjustPct: number;
            color: string | null;
            userId: string;
        } | null;
        factor: number;
        adjusted: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    getTodayAssignment(userId: string): Promise<({
        dayType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isDefault: boolean;
            tdeAdjustPct: number;
            color: string | null;
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        dayTypeId: string;
        date: Date;
    }) | null>;
    private parseDate;
}
