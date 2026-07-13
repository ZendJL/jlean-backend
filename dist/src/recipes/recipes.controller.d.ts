import { RecipesService } from './recipes.service';
import { RecipeBuilderService } from './recipe-builder.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { BuildMacrosDto } from './dto/build-macros.dto';
import { BuildMicrosDto } from './dto/build-micros.dto';
export declare class RecipesController {
    private recipes;
    private builder;
    constructor(recipes: RecipesService, builder: RecipeBuilderService);
    create(req: any, dto: CreateRecipeDto): Promise<{
        id: any;
        name: any;
        description: any;
        servings: any;
        isPublic: any;
        isOwner: boolean;
        createdAt: any;
        items: any;
        macrosTotal: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        macrosPerServing: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    findAll(req: any): Promise<{
        id: any;
        name: any;
        description: any;
        servings: any;
        isPublic: any;
        isOwner: boolean;
        createdAt: any;
        items: any;
        macrosTotal: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        macrosPerServing: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }[]>;
    findOne(req: any, id: string): Promise<{
        id: any;
        name: any;
        description: any;
        servings: any;
        isPublic: any;
        isOwner: boolean;
        createdAt: any;
        items: any;
        macrosTotal: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        macrosPerServing: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    update(req: any, id: string, dto: UpdateRecipeDto): Promise<{
        id: any;
        name: any;
        description: any;
        servings: any;
        isPublic: any;
        isOwner: boolean;
        createdAt: any;
        items: any;
        macrosTotal: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        macrosPerServing: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
    buildByMacros(dto: BuildMacrosDto): Promise<import("./recipe-builder.service").MacrosBuildResult>;
    buildByMicros(dto: BuildMicrosDto): Promise<import("./recipe-builder.service").MicrosBuildResult>;
}
