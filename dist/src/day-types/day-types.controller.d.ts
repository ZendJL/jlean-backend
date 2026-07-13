import { DayTypesService } from './day-types.service';
import { CreateDayTypeDto, UpdateDayTypeDto } from './dto/day-type.dto';
export declare class DayTypesController {
    private service;
    constructor(service: DayTypesService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }[]>;
    create(req: any, dto: CreateDayTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }>;
    update(req: any, id: string, dto: UpdateDayTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
        tdeAdjustPct: number;
        color: string | null;
        userId: string;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
    assign(req: any, date: string, body: {
        dayTypeId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        dayTypeId: string;
        date: Date;
    }>;
    removeAssignment(req: any, date: string): Promise<{
        deleted: boolean;
    }>;
    today(req: any): Promise<({
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
    targets(req: any, date: string): Promise<{
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
}
