import { DiaryService } from './diary.service';
import { AddDiaryItemDto } from './dto/add-item.dto';
import { UpdateDiaryItemDto } from './dto/update-item.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
export declare class DiaryController {
    private diary;
    constructor(diary: DiaryService);
    getLog(req: any, date?: string): Promise<{
        id: any;
        date: any;
        items: any;
    }>;
    getSummary(req: any, date?: string): Promise<{
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
    getHistory(req: any, query: HistoryQueryDto): Promise<{
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
    addItem(req: any, dto: AddDiaryItemDto): Promise<{
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
        alerts: import("./diary.service").DiaryAlert[];
    }>;
    updateItem(req: any, id: string, dto: UpdateDiaryItemDto): Promise<{
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
    deleteItem(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
