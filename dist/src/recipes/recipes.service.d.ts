import { PrismaService } from '../prisma/prisma.service';
interface CreateRecipeDto {
    name: string;
    description?: string;
    servings?: number;
    isPublic?: boolean;
    items: {
        foodId: string;
        quantityG: number;
    }[];
}
interface UpdateRecipeDto {
    name?: string;
    description?: string;
    servings?: number;
    isPublic?: boolean;
    items?: {
        foodId: string;
        quantityG: number;
    }[];
}
export declare class RecipesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateRecipeDto): Promise<{
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
    findAll(userId: string): Promise<{
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
    findOne(userId: string, id: string): Promise<{
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
    update(userId: string, id: string, dto: UpdateRecipeDto): Promise<{
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
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    private recipeInclude;
    private formatRecipe;
    private calcMacros;
    private round;
}
export {};
