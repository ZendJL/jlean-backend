export declare class RecipeItemDto {
    foodId: string;
    quantityG: number;
}
export declare class CreateRecipeDto {
    name: string;
    description?: string;
    servings?: number;
    isPublic?: boolean;
    items: RecipeItemDto[];
}
