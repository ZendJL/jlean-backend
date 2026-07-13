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
exports.MealPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MealPlanService = class MealPlanService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(userId) {
        return this.prisma.mealPlan.findMany({
            where: { userId },
            orderBy: { weekStart: 'desc' },
            include: { items: { include: { food: true, recipe: true } } },
        });
    }
    async findOne(userId, id) {
        const plan = await this.prisma.mealPlan.findUnique({
            where: { id },
            include: { items: { include: { food: true, recipe: true }, orderBy: { date: 'asc' } } },
        });
        if (!plan)
            throw new common_1.NotFoundException('Meal plan not found');
        if (plan.userId !== userId)
            throw new common_1.ForbiddenException();
        return plan;
    }
    async create(userId, dto) {
        return this.prisma.mealPlan.create({
            data: {
                userId,
                name: dto.name,
                weekStart: new Date(dto.weekStart),
            },
            include: { items: true },
        });
    }
    async remove(userId, id) {
        const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Meal plan not found');
        if (plan.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.mealPlan.delete({ where: { id } });
    }
    async addItem(userId, planId, dto) {
        const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Meal plan not found');
        if (plan.userId !== userId)
            throw new common_1.ForbiddenException();
        if (!dto.foodId && !dto.recipeId)
            throw new common_1.BadRequestException('foodId or recipeId required');
        return this.prisma.mealPlanItem.create({
            data: {
                planId,
                date: new Date(dto.date),
                meal: dto.meal,
                foodId: dto.foodId,
                recipeId: dto.recipeId,
                quantityG: dto.quantityG,
            },
            include: { food: true, recipe: true },
        });
    }
    async removeItem(userId, planId, itemId) {
        const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Meal plan not found');
        if (plan.userId !== userId)
            throw new common_1.ForbiddenException();
        const item = await this.prisma.mealPlanItem.findUnique({ where: { id: itemId } });
        if (!item || item.planId !== planId)
            throw new common_1.NotFoundException('Item not found');
        return this.prisma.mealPlanItem.delete({ where: { id: itemId } });
    }
    async applyToLog(userId, planId) {
        const plan = await this.findOne(userId, planId);
        const results = [];
        const byDate = new Map();
        for (const item of plan.items) {
            const key = item.date.toISOString().split('T')[0];
            if (!byDate.has(key))
                byDate.set(key, []);
            byDate.get(key).push(item);
        }
        for (const [dateStr, items] of byDate) {
            const date = new Date(dateStr);
            let log = await this.prisma.foodLog.findUnique({
                where: { userId_date: { userId, date } },
            });
            if (!log) {
                log = await this.prisma.foodLog.create({ data: { userId, date } });
            }
            for (const item of items) {
                const food = item.food;
                const factor = item.quantityG / (food?.servingSizeG ?? 100);
                await this.prisma.foodLogItem.create({
                    data: {
                        logId: log.id,
                        foodId: item.foodId,
                        recipeId: item.recipeId,
                        meal: item.meal,
                        quantityG: item.quantityG,
                        snapshotName: food?.name ?? item.recipe?.name,
                        snapshotCalories: food ? parseFloat((food.calories * factor).toFixed(1)) : null,
                        snapshotProtein: food ? parseFloat((food.protein * factor).toFixed(1)) : null,
                        snapshotCarbs: food ? parseFloat((food.carbs * factor).toFixed(1)) : null,
                        snapshotFat: food ? parseFloat((food.fat * factor).toFixed(1)) : null,
                    },
                });
            }
            results.push({ date: dateStr, itemsAdded: items.length });
        }
        return { planId, applied: results };
    }
};
exports.MealPlanService = MealPlanService;
exports.MealPlanService = MealPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MealPlanService);
//# sourceMappingURL=meal-plan.service.js.map