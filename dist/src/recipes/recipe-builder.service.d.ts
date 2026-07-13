import { PrismaService } from '../prisma/prisma.service';
export interface MacrosTargetDto {
    targetCalories: number;
    targetProtein: number;
    carbFatBalance?: 'balanced' | 'low_carb' | 'low_fat';
    presetsOnly?: boolean;
}
export interface MicrosTargetDto {
    microField: keyof MicroFields;
    gapAmount: number;
    maxCalories?: number;
}
export interface MicroFields {
    vitaminA?: number | null;
    vitaminC?: number | null;
    vitaminD?: number | null;
    vitaminE?: number | null;
    vitaminK?: number | null;
    vitaminB1?: number | null;
    vitaminB2?: number | null;
    vitaminB3?: number | null;
    vitaminB6?: number | null;
    vitaminB12?: number | null;
    folate?: number | null;
    calcium?: number | null;
    iron?: number | null;
    magnesium?: number | null;
    phosphorus?: number | null;
    potassium?: number | null;
    sodium?: number | null;
    zinc?: number | null;
    selenium?: number | null;
    fiber?: number | null;
}
export interface SuggestedIngredient {
    foodId: string;
    foodName: string;
    brand: string | null;
    suggestedQuantityG: number;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    microContribution?: number;
}
export interface MacrosBuildResult {
    mode: 'MACROS';
    targetCalories: number;
    targetProtein: number;
    achievedCalories: number;
    achievedProtein: number;
    calorieAccuracy: number;
    proteinAccuracy: number;
    ingredients: SuggestedIngredient[];
}
export interface MicrosBuildResult {
    mode: 'MICROS';
    microField: string;
    gapAmount: number;
    coveredAmount: number;
    coveragePercent: number;
    ingredients: SuggestedIngredient[];
}
export declare class RecipeBuilderService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    buildByMacros(dto: MacrosTargetDto): Promise<MacrosBuildResult>;
    buildByMicros(dto: MicrosTargetDto): Promise<MicrosBuildResult>;
    private round;
}
