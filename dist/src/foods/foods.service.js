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
var FoodsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const usda_client_1 = require("./usda.client");
const off_client_1 = require("./off.client");
const SOURCE_PRIORITY = {
    PRESET: 0,
    CUSTOM: 1,
    OFF: 2,
    USDA: 3,
};
let FoodsService = FoodsService_1 = class FoodsService {
    prisma;
    usda;
    off;
    logger = new common_1.Logger(FoodsService_1.name);
    constructor(prisma, usda, off) {
        this.prisma = prisma;
        this.usda = usda;
        this.off = off;
    }
    async search(query, source = 'local') {
        if (source === 'usda') {
            try {
                const results = await this.usda.search(query);
                return results.map(FoodsService_1.mapUsdaToView);
            }
            catch (err) {
                if (err?.status === 429 || err?.getStatus?.() === 429)
                    throw err;
                this.logger.warn(`USDA search falló (${err?.message ?? err}), usando catálogo local como fallback`);
                return this.searchLocal(query);
            }
        }
        if (source === 'off') {
            try {
                const results = await this.off.search(query);
                return results.map(FoodsService_1.mapOffToView);
            }
            catch (err) {
                if (err?.status === 429 || err?.getStatus?.() === 429)
                    throw err;
                this.logger.warn(`OFF search falló (${err?.message ?? err}), usando catálogo local como fallback`);
                return this.searchLocal(query);
            }
        }
        return this.searchLocal(query);
    }
    async searchLocal(query) {
        const foods = await this.prisma.food.findMany({
            where: { name: { contains: query, mode: 'insensitive' } },
            orderBy: [{ name: 'asc' }],
            take: 50,
        });
        return foods.sort((a, b) => {
            const pa = SOURCE_PRIORITY[a.source] ?? 99;
            const pb = SOURCE_PRIORITY[b.source] ?? 99;
            if (pa !== pb)
                return pa - pb;
            return a.name.localeCompare(b.name);
        });
    }
    async getByBarcode(barcode) {
        const cached = await this.prisma.food.findFirst({ where: { barcode } });
        if (cached)
            return cached;
        const offFood = await this.off.getByBarcode(barcode);
        if (!offFood)
            throw new common_1.NotFoundException(`Food with barcode ${barcode} not found`);
        return this.importOffFood(offFood);
    }
    async getById(id) {
        const food = await this.prisma.food.findUnique({ where: { id } });
        if (!food)
            throw new common_1.NotFoundException(`Food ${id} not found`);
        return food;
    }
    async importFromUsda(fdcId) {
        const existing = await this.prisma.food.findFirst({
            where: { source: client_1.FoodSource.USDA, externalId: String(fdcId) },
        });
        if (existing) {
            this.logger.log(`USDA food fdcId=${fdcId} ya existe en BD (id=${existing.id}), retornando existente`);
            return existing;
        }
        let detail = null;
        try {
            detail = await this.usda.getDetail(fdcId);
        }
        catch (err) {
            if (err?.status === 429 || err?.getStatus?.() === 429)
                throw err;
            this.logger.warn(`USDA getDetail fdcId=${fdcId} falló: ${err?.message}`);
            throw new common_1.NotFoundException(`No se pudo obtener el alimento USDA ${fdcId}. Intenta más tarde.`);
        }
        if (!detail)
            throw new common_1.NotFoundException(`USDA food ${fdcId} not found`);
        this.logger.log(`Importando USDA food fdcId=${fdcId} → "${detail.description}"`);
        return this.prisma.food.create({
            data: {
                name: detail.description,
                source: client_1.FoodSource.USDA,
                externalId: String(detail.fdcId),
                brand: detail.brandOwner,
                servingSizeG: detail.servingSize ?? 100,
                servingUnit: detail.servingSizeUnit ?? 'g',
                calories: detail.calories,
                protein: detail.protein,
                carbs: detail.carbs,
                fat: detail.fat,
                fiber: detail.fiber,
                sugar: detail.sugar,
                sodium: detail.sodium,
                saturatedFat: detail.saturatedFat,
                caffeineMg: detail.caffeineMg,
                qualityStatus: client_1.DataQuality.COMPLETE,
            },
        });
    }
    async importOffFood(offFood) {
        const existing = await this.prisma.food.findFirst({
            where: { source: client_1.FoodSource.OFF, externalId: offFood.barcode },
        });
        if (existing) {
            this.logger.log(`OFF food barcode=${offFood.barcode} ya existe (id=${existing.id}), retornando existente`);
            return existing;
        }
        this.logger.log(`Importando OFF food barcode=${offFood.barcode} → "${offFood.name}"`);
        return this.prisma.food.create({
            data: {
                name: offFood.name,
                brand: offFood.brand,
                source: client_1.FoodSource.OFF,
                externalId: offFood.barcode,
                barcode: offFood.barcode,
                servingSizeG: offFood.servingSizeG,
                servingUnit: 'g',
                calories: offFood.calories,
                protein: offFood.protein,
                carbs: offFood.carbs,
                fat: offFood.fat,
                fiber: offFood.fiber,
                sugar: offFood.sugar,
                sodium: offFood.sodium,
                saturatedFat: offFood.saturatedFat,
                qualityStatus: offFood.qualityStatus,
            },
        });
    }
    async createCustomFood(dto) {
        return this.prisma.food.create({
            data: {
                ...dto,
                source: client_1.FoodSource.CUSTOM,
                qualityStatus: client_1.DataQuality.COMPLETE,
            },
        });
    }
    static mapUsdaToView(f) {
        return {
            id: `usda-${f.fdcId}`,
            name: f.description,
            brand: f.brandOwner,
            source: 'USDA',
            externalId: String(f.fdcId),
            servingSizeG: f.servingSize ?? 100,
            servingUnit: f.servingSizeUnit ?? 'g',
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            fiber: f.fiber,
            sugar: f.sugar,
            sodium: f.sodium,
            saturatedFat: f.saturatedFat,
            caffeineMg: f.caffeineMg,
            qualityStatus: 'COMPLETE',
        };
    }
    static mapOffToView(f) {
        return {
            id: `off-${f.barcode}`,
            name: f.name,
            brand: f.brand,
            source: 'OFF',
            externalId: f.barcode,
            barcode: f.barcode,
            servingSizeG: f.servingSizeG,
            servingUnit: 'g',
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            fiber: f.fiber,
            sugar: f.sugar,
            sodium: f.sodium,
            saturatedFat: f.saturatedFat,
            qualityStatus: f.qualityStatus,
        };
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = FoodsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        usda_client_1.UsdaClient,
        off_client_1.OffClient])
], FoodsService);
//# sourceMappingURL=foods.service.js.map