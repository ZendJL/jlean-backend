import { RecipeItemDto } from './create-recipe.dto';
export declare class UpdateRecipeDto {
    name?: string;
    description?: string;
    servings?: number;
    isPublic?: boolean;
    items?: RecipeItemDto[];
}
