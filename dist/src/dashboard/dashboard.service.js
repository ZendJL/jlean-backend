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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const CAFFEINE_LATE_LIMIT_MG = 200;
const CAFFEINE_LATE_HOUR = 18;
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getToday(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        const log = await this.prisma.foodLog.findFirst({
            where: { userId, date: today },
            include: { items: { include: { food: true, recipe: { include: { items: { include: { food: true } } } } } } },
        });
        const supplementLogs = await this.prisma.supplementLog.findMany({
            where: { userId, takenAt: { gte: today } },
            include: { supplement: true },
        });
        const supplements = await this.prisma.supplement.findMany({
            where: { userId, active: true },
        });
        const fastingConfig = await this.prisma.fastingConfig.findUnique({ where: { userId } });
        const lastSleep = await this.prisma.sleepEntry.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const items = log?.items ?? [];
        const meals = {};
        for (const item of items) {
            const key = item.meal ?? 'OTHER';
            if (!meals[key])
                meals[key] = [];
            meals[key].push(item);
        }
        const consumed = this.calcConsumed(items);
        const targets = {
            calories: profile?.calorieTarget ?? 2000,
            protein: profile?.proteinTarget ?? 150,
            carbs: profile?.carbTarget ?? 200,
            fat: profile?.fatTarget ?? 65,
        };
        const remaining = {
            calories: this.round(targets.calories - consumed.calories),
            protein: this.round(targets.protein - consumed.protein),
            carbs: this.round(targets.carbs - consumed.carbs),
            fat: this.round(targets.fat - consumed.fat),
        };
        const takenIds = new Set(supplementLogs.map((l) => l.supplementId));
        const pendingSupplements = supplements.filter((s) => !takenIds.has(s.id));
        const caffeineMgToday = this.calcCaffeine(items);
        const insights = [];
        const currentHour = new Date().getHours();
        if (remaining.protein < 0) {
            insights.push({ type: 'PROTEIN_EXCEEDED', level: 'warning', message: `Protein target exceeded by ${Math.abs(remaining.protein).toFixed(1)}g.` });
        }
        else if (targets.protein > 0 && remaining.protein > targets.protein * 0.3) {
            insights.push({ type: 'PROTEIN_AVAILABLE', level: 'info', message: `You still have ${remaining.protein.toFixed(1)}g of protein available today.` });
        }
        if (remaining.carbs < 0) {
            insights.push({ type: 'CARBS_EXCEEDED', level: 'warning', message: `Carbs target exceeded by ${Math.abs(remaining.carbs).toFixed(1)}g.` });
        }
        else if (targets.carbs > 0 && remaining.carbs > targets.carbs * 0.3) {
            insights.push({ type: 'CARBS_AVAILABLE', level: 'info', message: `You still have ${remaining.carbs.toFixed(1)}g of carbs available today.` });
        }
        if (remaining.fat < 0) {
            insights.push({ type: 'FAT_EXCEEDED', level: 'warning', message: `Fat target exceeded by ${Math.abs(remaining.fat).toFixed(1)}g.` });
        }
        if (remaining.calories <= 0) {
            insights.push({ type: 'CALORIE_GOAL_REACHED', level: 'warning', message: `You have reached your calorie goal for today.` });
        }
        else if (targets.calories > 0 && remaining.calories < targets.calories * 0.1) {
            insights.push({ type: 'CALORIE_APPROACHING', level: 'warning', message: `Approaching your calorie goal — only ${Math.round(remaining.calories)} kcal left.` });
        }
        else if (targets.calories > 0 && remaining.calories > targets.calories * 0.25) {
            insights.push({ type: 'CALORIE_BUDGET_AVAILABLE', level: 'info', message: `${Math.round(remaining.calories)} kcal remaining for today.` });
        }
        if (caffeineMgToday > CAFFEINE_LATE_LIMIT_MG && currentHour >= CAFFEINE_LATE_HOUR) {
            insights.push({ type: 'CAFFEINE_LATE', level: 'warning', message: `You've had ${Math.round(caffeineMgToday)}mg of caffeine today. Avoid more after ${CAFFEINE_LATE_HOUR}:00 to protect your sleep.` });
        }
        if (supplements.length > 0 && pendingSupplements.length === 0) {
            insights.push({ type: 'SUPPLEMENTS_DONE', level: 'success', message: `All supplements taken for today. Great job!` });
        }
        else if (pendingSupplements.length > 0) {
            const names = pendingSupplements.map((s) => s.name).join(', ');
            insights.push({ type: 'SUPPLEMENTS_PENDING', level: 'info', message: `Pending supplements: ${names}.` });
        }
        let fastingStatus = null;
        if (fastingConfig?.active) {
            const hour = new Date().getHours();
            const eatEnd = (fastingConfig.eatStartHour + fastingConfig.eatHours) % 24;
            const inEatingWindow = fastingConfig.eatStartHour <= eatEnd
                ? hour >= fastingConfig.eatStartHour && hour < eatEnd
                : hour >= fastingConfig.eatStartHour || hour < eatEnd;
            fastingStatus = {
                active: true,
                fasting: !inEatingWindow,
                inEatingWindow,
                windowLabel: `${fastingConfig.fastHours}:${fastingConfig.eatHours}`,
                eatStartHour: fastingConfig.eatStartHour,
                eatEndHour: eatEnd,
                message: inEatingWindow
                    ? `Eating window open until ${eatEnd}:00`
                    : `Fasting — window opens at ${fastingConfig.eatStartHour}:00`,
            };
        }
        return {
            date: today,
            targets,
            consumed,
            remaining,
            meals,
            logItems: items,
            insights,
            pendingSupplements,
            takenSupplements: supplementLogs,
            fastingStatus,
            lastSleep,
        };
    }
    calcConsumed(items) {
        const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        for (const item of items) {
            const m = this.calcItemMacros(item);
            t.calories += m.calories;
            t.protein += m.protein;
            t.carbs += m.carbs;
            t.fat += m.fat;
        }
        return {
            calories: this.round(t.calories),
            protein: this.round(t.protein),
            carbs: this.round(t.carbs),
            fat: this.round(t.fat),
        };
    }
    calcItemMacros(item) {
        const r = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (item.food) {
            const ratio = item.quantityG / (item.food.servingSizeG || 100);
            r.calories += item.food.calories * ratio;
            r.protein += item.food.protein * ratio;
            r.carbs += item.food.carbs * ratio;
            r.fat += item.food.fat * ratio;
        }
        if (item.recipe) {
            const servings = item.recipe.servings || 1;
            for (const ri of item.recipe?.items ?? []) {
                const grams = ri.quantityG * (item.quantityG / servings);
                const ratio = grams / (ri.food.servingSizeG || 100);
                r.calories += ri.food.calories * ratio;
                r.protein += ri.food.protein * ratio;
                r.carbs += ri.food.carbs * ratio;
                r.fat += ri.food.fat * ratio;
            }
        }
        return {
            calories: this.round(r.calories),
            protein: this.round(r.protein),
            carbs: this.round(r.carbs),
            fat: this.round(r.fat),
        };
    }
    calcCaffeine(items) {
        return items.reduce((acc, item) => {
            if (item.food) {
                const ratio = item.quantityG / (item.food.servingSizeG || 100);
                return acc + (item.food.caffeineMg ?? 0) * ratio;
            }
            if (item.recipe) {
                const servings = item.recipe.servings || 1;
                for (const ri of item.recipe?.items ?? []) {
                    const grams = ri.quantityG * (item.quantityG / servings);
                    const ratio = grams / (ri.food.servingSizeG || 100);
                    acc += (ri.food.caffeineMg ?? 0) * ratio;
                }
            }
            return acc;
        }, 0);
    }
    round(n) {
        return Math.round(n * 10) / 10;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map