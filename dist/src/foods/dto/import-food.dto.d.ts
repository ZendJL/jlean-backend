import { FoodSource } from '@prisma/client';
export declare class ImportFoodDto {
    externalId: string;
    source: FoodSource;
    name: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSizeG?: number;
}
