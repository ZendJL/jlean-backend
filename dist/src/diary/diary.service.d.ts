import { PrismaService } from '../prisma/prisma.service';
import { Meal } from '@prisma/client';
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
    constructor(prisma: PrismaService);
    getLog(userId: string, dateStr?: string): Promise<{
        id: any;
        date: any;
        items: any;
    }>;
    addItem(userId: string, dto: AddItemDto, dateStr?: string): Promise<{
        food: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            brand: string | null;
            source: import("@prisma/client").$Enums.FoodSource;
            externalId: string | null;
            barcode: string | null;
            servingSizeG: number;
            servingUnit: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number | null;
            sugar: number | null;
            sodium: number | null;
            saturatedFat: number | null;
        } | null;
        recipe: ({
            items: ({
                food: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    brand: string | null;
                    source: import("@prisma/client").$Enums.FoodSource;
                    externalId: string | null;
                    barcode: string | null;
                    servingSizeG: number;
                    servingUnit: string;
                    calories: number;
                    protein: number;
                    carbs: number;
                    fat: number;
                    fiber: number | null;
                    sugar: number | null;
                    sodium: number | null;
                    saturatedFat: number | null;
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
    }>;
    updateItem(userId: string, itemId: string, dto: UpdateItemDto): Promise<{
        food: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            brand: string | null;
            source: import("@prisma/client").$Enums.FoodSource;
            externalId: string | null;
            barcode: string | null;
            servingSizeG: number;
            servingUnit: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number | null;
            sugar: number | null;
            sodium: number | null;
            saturatedFat: number | null;
        } | null;
        recipe: ({
            items: ({
                food: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    brand: string | null;
                    source: import("@prisma/client").$Enums.FoodSource;
                    externalId: string | null;
                    barcode: string | null;
                    servingSizeG: number;
                    servingUnit: string;
                    calories: number;
                    protein: number;
                    carbs: number;
                    fat: number;
                    fiber: number | null;
                    sugar: number | null;
                    sodium: number | null;
                    saturatedFat: number | null;
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
    private calcItemMacros;
    private calcConsumed;
    private round;
}
export {};
