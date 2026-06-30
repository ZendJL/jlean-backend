import { Injectable, BadRequestException } from '@nestjs/common';

export type GenderType     = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityType   = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type GoalType       = 'LOSE' | 'MAINTAIN' | 'GAIN';

const ACTIVITY_MULTIPLIER: Record<ActivityType, number> = {
  SEDENTARY:          1.2,
  LIGHTLY_ACTIVE:     1.375,
  MODERATELY_ACTIVE:  1.55,
  VERY_ACTIVE:        1.725,
  EXTRA_ACTIVE:       1.9,
};

const GOAL_CONFIG: Record<GoalType, { tdeeAdj: number; protein: number; carbs: number; fat: number }> = {
  LOSE:     { tdeeAdj: -0.20, protein: 0.35, carbs: 0.40, fat: 0.25 },
  MAINTAIN: { tdeeAdj:  0,    protein: 0.30, carbs: 0.45, fat: 0.25 },
  GAIN:     { tdeeAdj:  0.15, protein: 0.30, carbs: 0.50, fat: 0.20 },
};

@Injectable()
export class CalcService {
  /** Mifflin-St Jeor BMR */
  calculateBMR(params: { weightKg: number; heightCm: number; age: number; gender: GenderType }): number {
    const { weightKg, heightCm, age, gender } = params;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'FEMALE' ? base - 161 : base + 5;
  }

  calculateTDEE(bmr: number, activity: ActivityType): number {
    return bmr * ACTIVITY_MULTIPLIER[activity];
  }

  calculateMacros(tdee: number, goal: GoalType) {
    const cfg            = GOAL_CONFIG[goal];
    const targetCalories = Math.round(tdee * (1 + cfg.tdeeAdj));
    return {
      targetCalories,
      proteinG: Math.round((targetCalories * cfg.protein) / 4),
      carbsG:   Math.round((targetCalories * cfg.carbs)   / 4),
      fatG:     Math.round((targetCalories * cfg.fat)     / 9),
    };
  }

  validateMacroConsistency(dto: { calories: number; protein: number; carbs: number; fat: number }) {
    const { calories, protein, carbs, fat } = dto;
    if ([calories, protein, carbs, fat].some(v => v < 0)) {
      throw new BadRequestException('Macro values cannot be negative.');
    }
    const calculated = protein * 4 + carbs * 4 + fat * 9;
    const tolerance  = calories * 0.05;
    if (Math.abs(calculated - calories) > tolerance + 10) {
      throw new BadRequestException(
        `Calorie/macro mismatch: declared ${calories} kcal, calculated ${Math.round(calculated)} kcal.`,
      );
    }
  }
}
