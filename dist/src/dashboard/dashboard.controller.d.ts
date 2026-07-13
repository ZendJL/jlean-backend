import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getToday(req: any): Promise<{
        date: Date;
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
        meals: Record<string, ({
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
        })[]>;
        logItems: ({
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
        })[];
        insights: import("./dashboard.service").DashboardInsight[];
        pendingSupplements: {
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
        }[];
        takenSupplements: ({
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
        })[];
        fastingStatus: Record<string, unknown> | null;
        lastSleep: {
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
        } | null;
    }>;
}
