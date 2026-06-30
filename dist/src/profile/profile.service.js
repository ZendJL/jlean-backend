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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfileService = class ProfileService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Perfil no encontrado');
        return profile;
    }
    async updateProfile(userId, dto) {
        const data = { ...dto };
        if (dto.birthDate)
            data.birthDate = new Date(dto.birthDate);
        const updated = await this.prisma.profile.update({
            where: { userId },
            data,
        });
        if (updated.weightKg && updated.heightCm && updated.birthDate && updated.gender) {
            const macros = this.calculateMacros(updated);
            return this.prisma.profile.update({
                where: { userId },
                data: macros,
            });
        }
        return updated;
    }
    calculateMacros(profile) {
        const age = this.getAge(profile.birthDate);
        let bmr;
        if (profile.gender === 'MALE') {
            bmr = 88.362 + (13.397 * profile.weightKg) + (4.799 * profile.heightCm) - (5.677 * age);
        }
        else {
            bmr = 447.593 + (9.247 * profile.weightKg) + (3.098 * profile.heightCm) - (4.330 * age);
        }
        const activityMultipliers = {
            SEDENTARY: 1.2,
            LIGHTLY_ACTIVE: 1.375,
            MODERATELY_ACTIVE: 1.55,
            VERY_ACTIVE: 1.725,
            EXTRA_ACTIVE: 1.9,
        };
        const tdee = bmr * (activityMultipliers[profile.activityLevel] ?? 1.2);
        const goalAdjustments = {
            LOSE: -500,
            MAINTAIN: 0,
            GAIN: 300,
        };
        const calorieTarget = Math.round(tdee + (goalAdjustments[profile.goal] ?? 0));
        const proteinTarget = Math.round((calorieTarget * 0.30) / 4);
        const carbTarget = Math.round((calorieTarget * 0.40) / 4);
        const fatTarget = Math.round((calorieTarget * 0.30) / 9);
        return { calorieTarget, proteinTarget, carbTarget, fatTarget };
    }
    getAge(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
            age--;
        return age;
    }
    async getDaily(userId) {
        const profile = await this.getProfile(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date: today } },
            include: {
                items: {
                    include: { food: true, recipe: { include: { items: { include: { food: true } } } } },
                },
            },
        });
        const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (log) {
            for (const item of log.items) {
                if (item.food) {
                    const ratio = item.quantityG / (item.food.servingSizeG || 100);
                    consumed.calories += item.food.calories * ratio;
                    consumed.protein += item.food.protein * ratio;
                    consumed.carbs += item.food.carbs * ratio;
                    consumed.fat += item.food.fat * ratio;
                }
                if (item.recipe) {
                    for (const ri of item.recipe.items) {
                        const ratio = (item.quantityG / (item.recipe.servings || 1)) / (ri.food.servingSizeG || 100) * ri.quantityG;
                        consumed.calories += ri.food.calories * ratio / ri.quantityG;
                        consumed.protein += ri.food.protein * ratio / ri.quantityG;
                        consumed.carbs += ri.food.carbs * ratio / ri.quantityG;
                        consumed.fat += ri.food.fat * ratio / ri.quantityG;
                    }
                }
            }
        }
        const round = (n) => Math.round(n * 10) / 10;
        return {
            date: today.toISOString().split('T')[0],
            targets: {
                calories: profile.calorieTarget ?? 0,
                protein: profile.proteinTarget ?? 0,
                carbs: profile.carbTarget ?? 0,
                fat: profile.fatTarget ?? 0,
            },
            consumed: {
                calories: round(consumed.calories),
                protein: round(consumed.protein),
                carbs: round(consumed.carbs),
                fat: round(consumed.fat),
            },
            remaining: {
                calories: round((profile.calorieTarget ?? 0) - consumed.calories),
                protein: round((profile.proteinTarget ?? 0) - consumed.protein),
                carbs: round((profile.carbTarget ?? 0) - consumed.carbs),
                fat: round((profile.fatTarget ?? 0) - consumed.fat),
            },
        };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map