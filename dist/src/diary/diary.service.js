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
exports.DiaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DiaryService = class DiaryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLog(userId, dateStr) {
        const date = this.parseDate(dateStr);
        let log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date } },
            include: this.logInclude(),
        });
        if (!log) {
            log = await this.prisma.foodLog.create({
                data: { userId, date },
                include: this.logInclude(),
            });
        }
        return this.formatLog(log);
    }
    async addItem(userId, dto, dateStr) {
        if (!dto.foodId && !dto.recipeId)
            throw new common_1.BadRequestException('Se requiere foodId o recipeId');
        const date = this.parseDate(dateStr);
        let log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date } },
        });
        if (!log)
            log = await this.prisma.foodLog.create({ data: { userId, date } });
        return this.prisma.foodLogItem.create({
            data: {
                logId: log.id,
                foodId: dto.foodId ?? null,
                recipeId: dto.recipeId ?? null,
                quantityG: dto.quantityG,
                meal: dto.meal ?? 'OTHER',
            },
            include: this.itemInclude(),
        });
    }
    async updateItem(userId, itemId, dto) {
        const item = await this.prisma.foodLogItem.findUnique({
            where: { id: itemId },
            include: { log: true },
        });
        if (!item || item.log.userId !== userId)
            throw new common_1.NotFoundException('Item no encontrado');
        return this.prisma.foodLogItem.update({
            where: { id: itemId },
            data: {
                ...(dto.quantityG !== undefined && { quantityG: dto.quantityG }),
                ...(dto.meal !== undefined && { meal: dto.meal }),
            },
            include: this.itemInclude(),
        });
    }
    async deleteItem(userId, itemId) {
        const item = await this.prisma.foodLogItem.findUnique({
            where: { id: itemId },
            include: { log: true },
        });
        if (!item || item.log.userId !== userId)
            throw new common_1.NotFoundException('Item no encontrado');
        await this.prisma.foodLogItem.delete({ where: { id: itemId } });
        return { deleted: true };
    }
    async getSummary(userId, dateStr) {
        const date = this.parseDate(dateStr);
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        const log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date } },
            include: this.logInclude(),
        });
        const consumed = this.calcConsumed(log?.items ?? []);
        return {
            date: date.toISOString().split('T')[0],
            targets: {
                calories: profile?.calorieTarget ?? 0,
                protein: profile?.proteinTarget ?? 0,
                carbs: profile?.carbTarget ?? 0,
                fat: profile?.fatTarget ?? 0,
            },
            consumed,
            remaining: {
                calories: this.round((profile?.calorieTarget ?? 0) - consumed.calories),
                protein: this.round((profile?.proteinTarget ?? 0) - consumed.protein),
                carbs: this.round((profile?.carbTarget ?? 0) - consumed.carbs),
                fat: this.round((profile?.fatTarget ?? 0) - consumed.fat),
            },
        };
    }
    async getHistory(userId, from, to) {
        const toDate = this.parseDate(to);
        const fromDate = from
            ? this.parseDate(from)
            : new Date(toDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        if (fromDate > toDate)
            throw new common_1.BadRequestException('from debe ser anterior a to');
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        const logs = await this.prisma.foodLog.findMany({
            where: {
                userId,
                date: { gte: fromDate, lte: toDate },
            },
            include: this.logInclude(),
            orderBy: { date: 'asc' },
        });
        const logMap = new Map(logs.map((l) => [l.date.toISOString().split('T')[0], l]));
        const days = [];
        const cursor = new Date(fromDate);
        while (cursor <= toDate) {
            const key = cursor.toISOString().split('T')[0];
            const log = logMap.get(key);
            const consumed = log
                ? this.calcConsumed(log.items)
                : { calories: 0, protein: 0, carbs: 0, fat: 0 };
            days.push({
                date: key,
                consumed,
                target: profile?.calorieTarget ?? 0,
                adherence: profile?.calorieTarget
                    ? Math.min(100, this.round((consumed.calories / profile.calorieTarget) * 100))
                    : null,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        const totals = days.reduce((acc, d) => ({
            calories: this.round(acc.calories + d.consumed.calories),
            protein: this.round(acc.protein + d.consumed.protein),
            carbs: this.round(acc.carbs + d.consumed.carbs),
            fat: this.round(acc.fat + d.consumed.fat),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        const count = days.length;
        const averages = {
            calories: this.round(totals.calories / count),
            protein: this.round(totals.protein / count),
            carbs: this.round(totals.carbs / count),
            fat: this.round(totals.fat / count),
        };
        return {
            from: fromDate.toISOString().split('T')[0],
            to: toDate.toISOString().split('T')[0],
            days,
            totals,
            averages,
            targets: {
                calories: profile?.calorieTarget ?? 0,
                protein: profile?.proteinTarget ?? 0,
                carbs: profile?.carbTarget ?? 0,
                fat: profile?.fatTarget ?? 0,
            },
        };
    }
    parseDate(dateStr) {
        const d = dateStr ? new Date(dateStr) : new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }
    itemInclude() {
        return {
            food: true,
            recipe: {
                include: { items: { include: { food: true } } },
            },
        };
    }
    logInclude() {
        return {
            items: {
                include: this.itemInclude(),
                orderBy: { createdAt: 'asc' },
            },
        };
    }
    formatLog(log) {
        return {
            id: log.id,
            date: log.date.toISOString().split('T')[0],
            items: log.items.map((item) => ({
                id: item.id,
                meal: item.meal,
                quantityG: item.quantityG,
                food: item.food ?? null,
                recipe: item.recipe ? { id: item.recipe.id, name: item.recipe.name } : null,
                macros: this.calcItemMacros(item),
            })),
        };
    }
    calcItemMacros(item) {
        const r = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (item.food) {
            const ratio = item.quantityG / (item.food.servingSizeG || 100);
            r.calories = item.food.calories * ratio;
            r.protein = item.food.protein * ratio;
            r.carbs = item.food.carbs * ratio;
            r.fat = item.food.fat * ratio;
        }
        if (item.recipe) {
            const portions = item.quantityG;
            const servings = item.recipe.servings || 1;
            for (const ri of item.recipe.items ?? []) {
                const grams = ri.quantityG * (portions / servings);
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
    round(n) {
        return Math.round(n * 10) / 10;
    }
};
exports.DiaryService = DiaryService;
exports.DiaryService = DiaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiaryService);
//# sourceMappingURL=diary.service.js.map