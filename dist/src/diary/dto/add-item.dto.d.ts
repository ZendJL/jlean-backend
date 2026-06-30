import { Meal } from '@prisma/client';
export declare class AddDiaryItemDto {
    foodId?: string;
    recipeId?: string;
    quantityG: number;
    meal?: Meal;
    date?: string;
}
