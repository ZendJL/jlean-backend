import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import { Meal } from '@prisma/client';
export interface DiaryAlert {
    type: 'CAFFEINE_LIMIT' | 'CAFFEINE_LATE' | 'ALCOHOL_DETECTED' | 'SODIUM_HIGH' | 'ALLERGEN_DETECTED';
    message: string;
}
interface AddItemDto {
    foodId?: string;
    recipeId?: string;
    quantityG: number;
    meal?: Meal;
}
interface UpdateItemDto {
    quantityG?: number;
    meal?: Meal;
}
export declare class DiaryService {
    private prisma;
    private dayTypes;
    private readonly logger;
    constructor(prisma: PrismaService, dayTypes: DayTypesService);
    getLog(userId: string, dateStr?: string): Promise<{
        id: any;
        date: any;
        items: any;
    }>;
    addItem(userId: string, dto: AddItemDto, dateStr?: string): Promise<{
        item: {
            food: {
                fiber: number | null;
                sugar: number | null;
                saturatedFat: number | null;
                caffeineMg: number | null;
                sodium: number | null;
                source: import("@prisma/client").$Enums.FoodSource;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                brand: string | null;
                externalId: string | null;
                barcode: string | null;
                servingSizeG: number;
                servingUnit: string;
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                alcoholG: number | null;
                qualityStatus: import("@prisma/client").$Enums.DataQuality;
            } | null;
            recipe: ({
                items: ({
                    food: {
                        fiber: number | null;
                        sugar: number | null;
                        saturatedFat: number | null;
                        caffeineMg: number | null;
                        sodium: number | null;
                        source: import("@prisma/client").$Enums.FoodSource;
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        brand: string | null;
                        externalId: string | null;
                        barcode: string | null;
                        servingSizeG: number;
                        servingUnit: string;
                        calories: number;
                        protein: number;
                        carbs: number;
                        fat: number;
                        alcoholG: number | null;
                        qualityStatus: import("@prisma/client").$Enums.DataQuality;
                    };
                } & {
                    id: string;
                    foodId: string;
                    recipeId: string;
                    quantityG: number;
                })[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                description: string | null;
                servings: number;
                isPublic: boolean;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            logId: string;
            foodId: string | null;
            recipeId: string | null;
            meal: import("@prisma/client").$Enums.Meal;
            quantityG: number;
            snapshotName: string | null;
            snapshotCalories: number | null;
            snapshotProtein: number | null;
            snapshotCarbs: number | null;
            snapshotFat: number | null;
        };
        macros: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        alerts: DiaryAlert[];
    }>;
    updateItem(userId: string, itemId: string, dto: UpdateItemDto): Promise<{
        food: {
            fiber: number | null;
            sugar: number | null;
            saturatedFat: number | null;
            caffeineMg: number | null;
            sodium: number | null;
            source: import("@prisma/client").$Enums.FoodSource;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            brand: string | null;
            externalId: string | null;
            barcode: string | null;
            servingSizeG: number;
            servingUnit: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            alcoholG: number | null;
            qualityStatus: import("@prisma/client").$Enums.DataQuality;
        } | null;
        recipe: ({
            items: ({
                food: {
                    fiber: number | null;
                    sugar: number | null;
                    saturatedFat: number | null;
                    caffeineMg: number | null;
                    sodium: number | null;
                    source: import("@prisma/client").$Enums.FoodSource;
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    brand: string | null;
                    externalId: string | null;
                    barcode: string | null;
                    servingSizeG: number;
                    servingUnit: string;
                    calories: number;
                    protein: number;
                    carbs: number;
                    fat: number;
                    alcoholG: number | null;
                    qualityStatus: import("@prisma/client").$Enums.DataQuality;
                };
            } & {
                id: string;
                foodId: string;
                recipeId: string;
                quantityG: number;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            servings: number;
            isPublic: boolean;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        logId: string;
        foodId: string | null;
        recipeId: string | null;
        meal: import("@prisma/client").$Enums.Meal;
        quantityG: number;
        snapshotName: string | null;
        snapshotCalories: number | null;
        snapshotProtein: number | null;
        snapshotCarbs: number | null;
        snapshotFat: number | null;
    }>;
    deleteItem(userId: string, itemId: string): Promise<{
        deleted: boolean;
    }>;
    getSummary(userId: string, dateStr?: string): Promise<{
        date: string;
        targets: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        dayType: {
            name: string;
            color: string | null;
            tdeAdjustPct: number;
            adjustFactor: number;
        } | null;
        consumed: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        remaining: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    getHistory(userId: string, from?: string, to?: string): Promise<{
        from: string;
        to: string;
        days: any[];
        totals: any;
        averages: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        targets: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    private parseDate;
    private itemInclude;
    private logInclude;
    private formatLog;
    calcItemMacros(item: any): {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    private calcItemNutrients;
    private calcConsumedNutrients;
    calcConsumed(items: any[]): {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    private round;
}
export {};
