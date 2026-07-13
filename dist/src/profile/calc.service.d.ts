export type GenderType = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityType = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN';
export declare class CalcService {
    calculateBMR(params: {
        weightKg: number;
        heightCm: number;
        age: number;
        gender: GenderType;
    }): number;
    calculateTDEE(bmr: number, activity: ActivityType): number;
    calculateMacros(tdee: number, goal: GoalType): {
        targetCalories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
    };
    validateMacroConsistency(dto: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }): void;
}
