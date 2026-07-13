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
var DiaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const day_types_service_1 = require("../day-types/day-types.service");
const CAFFEINE_DAILY_LIMIT_MG = 400;
const CAFFEINE_LATE_LIMIT_MG = 200;
const CAFFEINE_LATE_HOUR = 18;
const SODIUM_HIGH_MG = 2300;
let DiaryService = DiaryService_1 = class DiaryService {
    prisma;
    dayTypes;
    logger = new common_1.Logger(DiaryService_1.name);
    constructor(prisma, dayTypes) {
        this.prisma = prisma;
        this.dayTypes = dayTypes;
    }
    async getLog(userId, dateStr) {
        const date = this.parseDate(dateStr);
        let log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date } },
            include: this.logInclude(),
        });
        if (!log) {
            this.logger.log(`Creando log del día ${date.toISOString().split('T')[0]} para userId=${userId}`);
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
        let food = null;
        let recipe = null;
        if (dto.foodId) {
            food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
            if (!food)
                throw new common_1.NotFoundException(`Alimento con id=${dto.foodId} no encontrado`);
        }
        if (dto.recipeId) {
            recipe = await this.prisma.recipe.findUnique({
                where: { id: dto.recipeId },
                include: { items: { include: { food: true } } },
            });
            if (!recipe)
                throw new common_1.NotFoundException(`Receta con id=${dto.recipeId} no encontrada`);
        }
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
        const newItemMock = { food, recipe, quantityG: dto.quantityG, meal: dto.meal ?? 'OTHER' };
        const newMacros = this.calcItemMacros(newItemMock);
        const newNutrients = this.calcItemNutrients(newItemMock);
        const prevNutrients = this.calcConsumedNutrients(log?.items ?? []);
        const totalCaffeine = (prevNutrients.caffeineMg ?? 0) + (newNutrients.caffeineMg ?? 0);
        const totalAlcohol = (prevNutrients.alcoholG ?? 0) + (newNutrients.alcoholG ?? 0);
        const totalSodium = (prevNutrients.sodiumMg ?? 0) + (newNutrients.sodiumMg ?? 0);
        const currentHour = new Date().getHours();
        const alerts = [];
        if (totalCaffeine > CAFFEINE_DAILY_LIMIT_MG) {
            alerts.push({
                type: 'CAFFEINE_LIMIT',
                message: `Daily caffeine limit exceeded (${Math.round(totalCaffeine)}mg / ${CAFFEINE_DAILY_LIMIT_MG}mg recommended).`,
            });
        }
        if (totalCaffeine > CAFFEINE_LATE_LIMIT_MG && currentHour >= CAFFEINE_LATE_HOUR) {
            alerts.push({
                type: 'CAFFEINE_LATE',
                message: `Consuming caffeine after ${CAFFEINE_LATE_HOUR}:00 may affect your sleep quality.`,
            });
        }
        if (totalAlcohol > 0) {
            alerts.push({
                type: 'ALCOHOL_DETECTED',
                message: `This item contains alcohol (${newNutrients.alcoholG?.toFixed(1)}g). Total today: ${totalAlcohol.toFixed(1)}g.`,
            });
        }
        if (totalSodium > SODIUM_HIGH_MG) {
            alerts.push({
                type: 'SODIUM_HIGH',
                message: `Daily sodium is high (${Math.round(totalSodium)}mg). Recommended max: ${SODIUM_HIGH_MG}mg.`,
            });
        }
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        const userAllergens = profile?.allergens ?? [];
        const foodAllergens = [
            ...(food?.allergens ?? []),
            ...(recipe?.items?.flatMap((ri) => ri.food?.allergens ?? []) ?? []),
        ];
        const matched = foodAllergens.filter((a) => userAllergens.some((ua) => ua.toLowerCase() === a.toLowerCase()));
        if (matched.length > 0) {
            throw new common_1.ForbiddenException(`This item contains allergens you've declared: ${matched.join(', ')}. Item not added.`);
        }
        this.logger.log(`Agregando item al log ${date.toISOString().split('T')[0]} ` +
            `(userId=${userId}, foodId=${dto.foodId ?? '-'}, recipeId=${dto.recipeId ?? '-'}, ` +
            `quantityG=${dto.quantityG}, meal=${dto.meal ?? 'OTHER'}, alerts=${alerts.length})`);
        const item = await this.prisma.foodLogItem.create({
            data: {
                logId: log.id,
                foodId: dto.foodId ?? null,
                recipeId: dto.recipeId ?? null,
                quantityG: dto.quantityG,
                meal: dto.meal ?? 'OTHER',
            },
            include: this.itemInclude(),
        });
        return { item, macros: newMacros, alerts };
    }
    async updateItem(userId, itemId, dto) {
        const item = await this.prisma.foodLogItem.findUnique({
            where: { id: itemId },
            include: { log: true },
        });
        if (!item || item.log.userId !== userId)
            throw new common_1.NotFoundException('Item no encontrado');
        this.logger.log(`Actualizando item id=${itemId} para userId=${userId}`);
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
        this.logger.log(`Eliminando item id=${itemId} para userId=${userId}`);
        await this.prisma.foodLogItem.delete({ where: { id: itemId } });
        return { deleted: true };
    }
    async getSummary(userId, dateStr) {
        const date = this.parseDate(dateStr);
        const adjusted = await this.dayTypes.getAdjustedTargets(userId, date);
        const log = await this.prisma.foodLog.findUnique({
            where: { userId_date: { userId, date } },
            include: this.logInclude(),
        });
        const consumed = this.calcConsumed(log?.items ?? []);
        const targets = adjusted.adjusted;
        return {
            date: date.toISOString().split('T')[0],
            targets,
            dayType: adjusted.dayType
                ? {
                    name: adjusted.dayType.name,
                    color: adjusted.dayType.color,
                    tdeAdjustPct: adjusted.dayType.tdeAdjustPct,
                    adjustFactor: adjusted.factor,
                }
                : null,
            consumed,
            remaining: {
                calories: this.round(targets.calories - consumed.calories),
                protein: this.round(targets.protein - consumed.protein),
                carbs: this.round(targets.carbs - consumed.carbs),
                fat: this.round(targets.fat - consumed.fat),
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
        if (isNaN(d.getTime()))
            throw new common_1.BadRequestException(`Fecha inválida: "${dateStr}". Usa formato YYYY-MM-DD.`);
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
            r.calories += item.food.calories * ratio;
            r.protein += item.food.protein * ratio;
            r.carbs += item.food.carbs * ratio;
            r.fat += item.food.fat * ratio;
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
    calcItemNutrients(item) {
        const r = { caffeineMg: 0, alcoholG: 0, sodiumMg: 0 };
        const extractFromFood = (food, ratio) => {
            if (!food)
                return;
            r.caffeineMg += (food.caffeineMg ?? 0) * ratio;
            r.alcoholG += (food.alcoholG ?? 0) * ratio;
            r.sodiumMg += (food.sodiumMg ?? 0) * ratio;
        };
        if (item.food) {
            const ratio = item.quantityG / (item.food.servingSizeG || 100);
            extractFromFood(item.food, ratio);
        }
        if (item.recipe) {
            const servings = item.recipe.servings || 1;
            for (const ri of item.recipe.items ?? []) {
                const grams = ri.quantityG * (item.quantityG / servings);
                const ratio = grams / (ri.food.servingSizeG || 100);
                extractFromFood(ri.food, ratio);
            }
        }
        return r;
    }
    calcConsumedNutrients(items) {
        return items.reduce((acc, item) => {
            const n = this.calcItemNutrients(item);
            return {
                caffeineMg: acc.caffeineMg + n.caffeineMg,
                alcoholG: acc.alcoholG + n.alcoholG,
                sodiumMg: acc.sodiumMg + n.sodiumMg,
            };
        }, { caffeineMg: 0, alcoholG: 0, sodiumMg: 0 });
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
exports.DiaryService = DiaryService = DiaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        day_types_service_1.DayTypesService])
], DiaryService);
//# sourceMappingURL=diary.service.js.map