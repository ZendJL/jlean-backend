import { Meal } from '@prisma/client';
export declare class AddMealPlanItemDto {
    date: string;
    meal: Meal;
    foodId?: string;
    recipeId?: string;
    quantityG: number;
}
