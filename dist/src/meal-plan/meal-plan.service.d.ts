import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
export declare class MealPlanService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
            } | null;
            recipe: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                description: string | null;
                servings: number;
                isPublic: boolean;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            date: Date;
            foodId: string | null;
            recipeId: string | null;
            meal: import("@prisma/client").$Enums.Meal;
            quantityG: number;
            planId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        weekStart: Date;
    })[]>;
    findOne(userId: string, id: string): Promise<{
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
            } | null;
            recipe: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                description: string | null;
                servings: number;
                isPublic: boolean;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            date: Date;
            foodId: string | null;
            recipeId: string | null;
            meal: import("@prisma/client").$Enums.Meal;
            quantityG: number;
            planId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        weekStart: Date;
    }>;
    create(userId: string, dto: CreateMealPlanDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            date: Date;
            foodId: string | null;
            recipeId: string | null;
            meal: import("@prisma/client").$Enums.Meal;
            quantityG: number;
            planId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        weekStart: Date;
    }>;
    remove(userId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        weekStart: Date;
    }>;
    addItem(userId: string, planId: string, dto: AddMealPlanItemDto): Promise<{
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
        recipe: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            servings: number;
            isPublic: boolean;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        foodId: string | null;
        recipeId: string | null;
        meal: import("@prisma/client").$Enums.Meal;
        quantityG: number;
        planId: string;
    }>;
    removeItem(userId: string, planId: string, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        foodId: string | null;
        recipeId: string | null;
        meal: import("@prisma/client").$Enums.Meal;
        quantityG: number;
        planId: string;
    }>;
    applyToLog(userId: string, planId: string): Promise<{
        planId: string;
        applied: {
            date: string;
            itemsAdded: number;
        }[];
    }>;
}
