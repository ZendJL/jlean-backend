"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecipeBuilderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeBuilderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const VALID_MICRO_FIELDS = [
    'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
    'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB6', 'vitaminB12',
    'folate', 'calcium', 'iron', 'magnesium', 'phosphorus',
    'potassium', 'sodium', 'zinc', 'selenium', 'fiber',
];
let RecipeBuilderService = RecipeBuilderService_1 = class RecipeBuilderService {
    prisma;
    logger = new common_1.Logger(RecipeBuilderService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async buildByMacros(dto) {
        if (dto.targetCalories < 50 || dto.targetCalories > 5000) {
            throw new common_1.BadRequestException('targetCalories debe estar entre 50 y 5000 kcal');
        }
        if (dto.targetProtein < 1 || dto.targetProtein > 500) {
            throw new common_1.BadRequestException('targetProtein debe estar entre 1 y 500 g');
        }
        const where = dto.presetsOnly ? { source: 'PRESET' } : {};
        const foods = await this.prisma.food.findMany({
            where: {
                ...where,
                calories: { gt: 0 },
                protein: { gt: 0 },
            },
            select: {
                id: true,
                name: true,
                brand: true,
                servingSizeG: true,
                calories: true,
                protein: true,
                carbs: true,
                fat: true,
                source: true,
            },
            take: 200,
        });
        if (foods.length === 0) {
            throw new common_1.BadRequestException('No hay alimentos en el catálogo para construir la receta');
        }
        const normalized = foods.map((f) => {
            const base = f.servingSizeG > 0 ? f.servingSizeG : 100;
            return {
                id: f.id,
                name: f.name,
                brand: f.brand,
                cal100: (f.calories / base) * 100,
                prot100: (f.protein / base) * 100,
                carbs100: (f.carbs / base) * 100,
                fat100: (f.fat / base) * 100,
            };
        });
        const proteinSources = normalized
            .filter((f) => f.prot100 >= 15)
            .sort((a, b) => (b.prot100 / b.cal100) - (a.prot100 / a.cal100));
        const carbSources = normalized
            .filter((f) => f.prot100 < 15 && f.carbs100 > f.fat100)
            .sort((a, b) => a.cal100 - b.cal100);
        const fatSources = normalized
            .filter((f) => f.prot100 < 15 && f.fat100 >= f.carbs100)
            .sort((a, b) => b.fat100 - a.fat100);
        const ingredients = [];
        let usedCalories = 0;
        let usedProtein = 0;
        if (proteinSources.length > 0) {
            const bestProtein = proteinSources[0];
            const gNeeded = (dto.targetProtein / bestProtein.prot100) * 100;
            const maxGByCal = (dto.targetCalories * 0.7) / (bestProtein.cal100 / 100);
            const quantityG = Math.min(gNeeded, maxGByCal);
            const ratio = quantityG / 100;
            ingredients.push({
                foodId: bestProtein.id,
                foodName: bestProtein.name,
                brand: bestProtein.brand,
                suggestedQuantityG: Math.round(quantityG),
                macros: {
                    calories: this.round(bestProtein.cal100 * ratio),
                    protein: this.round(bestProtein.prot100 * ratio),
                    carbs: this.round(bestProtein.carbs100 * ratio),
                    fat: this.round(bestProtein.fat100 * ratio),
                },
            });
            usedCalories += bestProtein.cal100 * ratio;
            usedProtein += bestProtein.prot100 * ratio;
        }
        const remainingCal = dto.targetCalories - usedCalories;
        if (remainingCal > 30) {
            const pool = dto.carbFatBalance === 'low_fat'
                ? [...carbSources]
                : dto.carbFatBalance === 'low_carb'
                    ? [...fatSources]
                    : [...carbSources, ...fatSources].sort(() => 0.5 - Math.random()).slice(0, 10);
            let remaining = remainingCal;
            for (const food of pool.slice(0, 2)) {
                if (remaining <= 20)
                    break;
                if (food.cal100 <= 0)
                    continue;
                const quantityG = Math.min((remaining / food.cal100) * 100, 300);
                const ratio = quantityG / 100;
                ingredients.push({
                    foodId: food.id,
                    foodName: food.name,
                    brand: food.brand,
                    suggestedQuantityG: Math.round(quantityG),
                    macros: {
                        calories: this.round(food.cal100 * ratio),
                        protein: this.round(food.prot100 * ratio),
                        carbs: this.round(food.carbs100 * ratio),
                        fat: this.round(food.fat100 * ratio),
                    },
                });
                usedCalories += food.cal100 * ratio;
                usedProtein += food.prot100 * ratio;
                remaining -= food.cal100 * ratio;
            }
        }
        const calorieAccuracy = dto.targetCalories > 0
            ? Math.min(100, Math.round((usedCalories / dto.targetCalories) * 100))
            : 0;
        const proteinAccuracy = dto.targetProtein > 0
            ? Math.min(100, Math.round((usedProtein / dto.targetProtein) * 100))
            : 0;
        this.logger.log(`buildByMacros: target=${dto.targetCalories}kcal/${dto.targetProtein}g → ` +
            `achieved=${this.round(usedCalories)}kcal/${this.round(usedProtein)}g ` +
            `(cal=${calorieAccuracy}%, prot=${proteinAccuracy}%)`);
        return {
            mode: 'MACROS',
            targetCalories: dto.targetCalories,
            targetProtein: dto.targetProtein,
            achievedCalories: this.round(usedCalories),
            achievedProtein: this.round(usedProtein),
            calorieAccuracy,
            proteinAccuracy,
            ingredients,
        };
    }
    async buildByMicros(dto) {
        if (!VALID_MICRO_FIELDS.includes(dto.microField)) {
            throw new common_1.BadRequestException(`microField inválido. Valores permitidos: ${VALID_MICRO_FIELDS.join(', ')}`);
        }
        if (dto.gapAmount <= 0) {
            throw new common_1.BadRequestException('gapAmount debe ser mayor a 0');
        }
        const maxCal = dto.maxCalories ?? 500;
        const foods = await this.prisma.food.findMany({
            where: {
                calories: { gt: 0 },
                [dto.microField]: { gt: 0 },
            },
            select: {
                id: true,
                name: true,
                brand: true,
                servingSizeG: true,
                calories: true,
                protein: true,
                carbs: true,
                fat: true,
                [dto.microField]: true,
            },
            take: 100,
        });
        if (foods.length === 0) {
            return {
                mode: 'MICROS',
                microField: dto.microField,
                gapAmount: dto.gapAmount,
                coveredAmount: 0,
                coveragePercent: 0,
                ingredients: [],
            };
        }
        const ranked = foods
            .map((f) => {
            const base = f.servingSizeG > 0 ? f.servingSizeG : 100;
            const microVal = (f[dto.microField] ?? 0);
            return {
                id: f.id,
                name: f.name,
                brand: f.brand,
                cal100: (f.calories / base) * 100,
                prot100: (f.protein / base) * 100,
                carbs100: (f.carbs / base) * 100,
                fat100: (f.fat / base) * 100,
                micro100: (microVal / base) * 100,
            };
        })
            .filter((f) => f.micro100 > 0)
            .sort((a, b) => b.micro100 - a.micro100);
        const ingredients = [];
        let coveredAmount = 0;
        let usedCalories = 0;
        for (const food of ranked.slice(0, 5)) {
            if (coveredAmount >= dto.gapAmount)
                break;
            const calRemaining = maxCal - usedCalories;
            if (calRemaining <= 10)
                break;
            const microRemaining = dto.gapAmount - coveredAmount;
            const gByMicro = (microRemaining / food.micro100) * 100;
            const gByCal = food.cal100 > 0 ? (calRemaining / food.cal100) * 100 : 300;
            const quantityG = Math.min(gByMicro, gByCal, 300);
            const ratio = quantityG / 100;
            const microContribution = this.round(food.micro100 * ratio);
            ingredients.push({
                foodId: food.id,
                foodName: food.name,
                brand: food.brand,
                suggestedQuantityG: Math.round(quantityG),
                macros: {
                    calories: this.round(food.cal100 * ratio),
                    protein: this.round(food.prot100 * ratio),
                    carbs: this.round(food.carbs100 * ratio),
                    fat: this.round(food.fat100 * ratio),
                },
                microContribution,
            });
            coveredAmount += microContribution;
            usedCalories += food.cal100 * ratio;
        }
        const coveragePercent = dto.gapAmount > 0
            ? Math.min(100, Math.round((coveredAmount / dto.gapAmount) * 100))
            : 0;
        this.logger.log(`buildByMicros: ${dto.microField} gap=${dto.gapAmount} → ` +
            `covered=${this.round(coveredAmount)} (${coveragePercent}%)`);
        return {
            mode: 'MICROS',
            microField: dto.microField,
            gapAmount: dto.gapAmount,
            coveredAmount: this.round(coveredAmount),
            coveragePercent,
            ingredients,
        };
    }
    round(n) {
        return Math.round(n * 10) / 10;
    }
};
exports.RecipeBuilderService = RecipeBuilderService;
exports.RecipeBuilderService = RecipeBuilderService = RecipeBuilderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipeBuilderService);
//# sourceMappingURL=recipe-builder.service.js.map