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
var ProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfileService = ProfileService_1 = class ProfileService {
    prisma;
    logger = new common_1.Logger(ProfileService_1.name);
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
        if (data.birthDate && isNaN(data.birthDate.getTime())) {
            throw new common_1.BadRequestException('Fecha de nacimiento inválida');
        }
        const updated = await this.prisma.profile.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
        if (updated.weightKg && updated.heightCm && updated.birthDate && updated.gender) {
            const macros = this.calculateMacros(updated);
            this.logger.log(`Macros calculados para userId=${userId}: ` +
                `cal=${macros.calorieTarget}, prot=${macros.proteinTarget}, ` +
                `carbs=${macros.carbTarget}, fat=${macros.fatTarget}`);
            const final = await this.prisma.profile.update({
                where: { userId },
                data: macros,
            });
            await this.saveGoalHistory(userId, final);
            return final;
        }
        return updated;
    }
    async saveGoalHistory(userId, profile) {
        await this.prisma.userGoal.updateMany({
            where: { userId, effectiveTo: null },
            data: { effectiveTo: new Date() },
        });
        await this.prisma.userGoal.create({
            data: {
                userId,
                calorieTarget: profile.calorieTarget ?? 0,
                proteinTarget: profile.proteinTarget ?? 0,
                carbTarget: profile.carbTarget ?? 0,
                fatTarget: profile.fatTarget ?? 0,
                goal: profile.goal,
                activityLevel: profile.activityLevel,
                effectiveFrom: new Date(),
                effectiveTo: null,
            },
        });
        this.logger.log(`Snapshot de metas guardado para userId=${userId}`);
    }
    async getGoalHistory(userId) {
        return this.prisma.userGoal.findMany({
            where: { userId },
            orderBy: { effectiveFrom: 'desc' },
        });
    }
    calculateMacros(profile) {
        if (!profile.birthDate)
            throw new common_1.BadRequestException('Fecha de nacimiento requerida para calcular macros');
        const age = this.getAge(profile.birthDate);
        if (age < 1 || age > 130)
            throw new common_1.BadRequestException(`Edad calculada fuera de rango: ${age} años`);
        let bmr;
        if (profile.gender === 'MALE') {
            bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * age) + 5;
        }
        else {
            bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * age) - 161;
        }
        const activityMultipliers = {
            SEDENTARY: 1.2,
            LIGHTLY_ACTIVE: 1.375,
            MODERATELY_ACTIVE: 1.55,
            VERY_ACTIVE: 1.725,
            EXTRA_ACTIVE: 1.9,
        };
        const tdee = bmr * (activityMultipliers[profile.activityLevel] ?? 1.2);
        const goalFactors = {
            LOSE: 0.80,
            MAINTAIN: 1.00,
            GAIN: 1.15,
        };
        const calorieTarget = Math.round(tdee * (goalFactors[profile.goal] ?? 1.0));
        const ratios = {
            LOSE: { p: 0.35, c: 0.40, f: 0.25 },
            MAINTAIN: { p: 0.30, c: 0.45, f: 0.25 },
            GAIN: { p: 0.30, c: 0.50, f: 0.20 },
        };
        const r = ratios[profile.goal] ?? ratios.MAINTAIN;
        const proteinTarget = Math.round((calorieTarget * r.p) / 4);
        const carbTarget = Math.round((calorieTarget * r.c) / 4);
        const fatTarget = Math.round((calorieTarget * r.f) / 9);
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
                if (item.snapshotCalories != null) {
                    consumed.calories += item.snapshotCalories;
                    consumed.protein += item.snapshotProtein ?? 0;
                    consumed.carbs += item.snapshotCarbs ?? 0;
                    consumed.fat += item.snapshotFat ?? 0;
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
exports.ProfileService = ProfileService = ProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map