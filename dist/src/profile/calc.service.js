"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalcService = void 0;
const common_1 = require("@nestjs/common");
const ACTIVITY_MULTIPLIER = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTRA_ACTIVE: 1.9,
};
const GOAL_CONFIG = {
    LOSE: { tdeeAdj: -0.20, protein: 0.35, carbs: 0.40, fat: 0.25 },
    MAINTAIN: { tdeeAdj: 0, protein: 0.30, carbs: 0.45, fat: 0.25 },
    GAIN: { tdeeAdj: 0.15, protein: 0.30, carbs: 0.50, fat: 0.20 },
};
let CalcService = class CalcService {
    calculateBMR(params) {
        const { weightKg, heightCm, age, gender } = params;
        const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
        return gender === 'FEMALE' ? base - 161 : base + 5;
    }
    calculateTDEE(bmr, activity) {
        return bmr * ACTIVITY_MULTIPLIER[activity];
    }
    calculateMacros(tdee, goal) {
        const cfg = GOAL_CONFIG[goal];
        const targetCalories = Math.round(tdee * (1 + cfg.tdeeAdj));
        return {
            targetCalories,
            proteinG: Math.round((targetCalories * cfg.protein) / 4),
            carbsG: Math.round((targetCalories * cfg.carbs) / 4),
            fatG: Math.round((targetCalories * cfg.fat) / 9),
        };
    }
    validateMacroConsistency(dto) {
        const { calories, protein, carbs, fat } = dto;
        if ([calories, protein, carbs, fat].some(v => v < 0)) {
            throw new common_1.BadRequestException('Macro values cannot be negative.');
        }
        const calculated = protein * 4 + carbs * 4 + fat * 9;
        const tolerance = calories * 0.05;
        if (Math.abs(calculated - calories) > tolerance + 10) {
            throw new common_1.BadRequestException(`Calorie/macro mismatch: declared ${calories} kcal, calculated ${Math.round(calculated)} kcal.`);
        }
    }
};
exports.CalcService = CalcService;
exports.CalcService = CalcService = __decorate([
    (0, common_1.Injectable)()
], CalcService);
//# sourceMappingURL=calc.service.js.map