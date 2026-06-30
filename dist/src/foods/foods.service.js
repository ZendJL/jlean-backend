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
exports.FoodsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const rxjs_1 = require("rxjs");
let FoodsService = class FoodsService {
    http;
    config;
    prisma;
    usdaBase = 'https://api.nal.usda.gov/fdc/v1';
    offBase = 'https://world.openfoodfacts.org/cgi/search.pl';
    offItem = 'https://world.openfoodfacts.org/api/v2/product';
    constructor(http, config, prisma) {
        this.http = http;
        this.config = config;
        this.prisma = prisma;
    }
    async search(q, source = 'local') {
        if (source === 'usda')
            return this.searchUsda(q);
        if (source === 'off')
            return this.searchOff(q);
        return this.searchLocal(q);
    }
    async searchLocal(q) {
        return this.prisma.food.findMany({
            where: { name: { contains: q, mode: 'insensitive' } },
            take: 20,
        });
    }
    async searchUsda(q) {
        const apiKey = this.config.get('USDA_FDC_API_KEY');
        const url = this.usdaBase + '/foods/search';
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { params: { query: q, api_key: apiKey, pageSize: 20 } }));
        return (data.foods ?? []).map((f) => ({
            externalId: String(f.fdcId),
            source: client_1.FoodSource.USDA,
            name: f.description,
            brand: f.brandOwner ?? null,
            calories: this.getNutrient(f.foodNutrients, 1008),
            protein: this.getNutrient(f.foodNutrients, 1003),
            carbs: this.getNutrient(f.foodNutrients, 1005),
            fat: this.getNutrient(f.foodNutrients, 1004),
            servingSizeG: f.servingSize ?? 100,
        }));
    }
    async searchOff(q) {
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(this.offBase, {
            params: { search_terms: q, json: 1, page_size: 20 },
        }));
        return (data.products ?? []).map((p) => this.mapOffProduct(p));
    }
    async getByBarcode(barcode) {
        const cached = await this.prisma.food.findFirst({
            where: { externalId: barcode, source: client_1.FoodSource.OPEN_FOOD_FACTS },
        });
        if (cached)
            return cached;
        const url = `${this.offItem}/${barcode}.json`;
        let data;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                params: { fields: 'product_name,brands,nutriments,serving_size,image_url' },
            }));
            data = res.data;
        }
        catch {
            throw new common_1.NotFoundException(`Producto con código ${barcode} no encontrado`);
        }
        if (data.status !== 1 || !data.product)
            throw new common_1.NotFoundException(`Producto con código ${barcode} no encontrado`);
        return this.mapOffProduct({ ...data.product, id: barcode });
    }
    async importFood(dto) {
        const existing = await this.prisma.food.findFirst({
            where: { externalId: dto.externalId, source: dto.source },
        });
        if (existing)
            return existing;
        return this.prisma.food.create({
            data: {
                externalId: dto.externalId,
                source: dto.source,
                name: dto.name,
                brand: dto.brand,
                calories: dto.calories,
                protein: dto.protein,
                carbs: dto.carbs,
                fat: dto.fat,
                servingSizeG: dto.servingSizeG ?? 100,
            },
        });
    }
    async getById(id) {
        const food = await this.prisma.food.findUnique({ where: { id } });
        if (!food)
            throw new common_1.NotFoundException('Alimento no encontrado');
        return food;
    }
    mapOffProduct(p) {
        return {
            externalId: String(p.id ?? p._id ?? ''),
            source: client_1.FoodSource.OPEN_FOOD_FACTS,
            name: p.product_name ?? p.product_name_en ?? 'Unknown',
            brand: p.brands ?? null,
            calories: this.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
            protein: this.round(p.nutriments?.protein_100g ?? 0),
            carbs: this.round(p.nutriments?.carbohydrates_100g ?? 0),
            fat: this.round(p.nutriments?.fat_100g ?? 0),
            servingSizeG: this.parseServingSize(p.serving_size) ?? 100,
            imageUrl: p.image_url ?? null,
        };
    }
    parseServingSize(raw) {
        if (!raw)
            return null;
        const match = raw.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
    }
    getNutrient(nutrients, nutrientId) {
        const n = nutrients?.find((x) => x.nutrientId === nutrientId);
        return n ? this.round(n.value) : 0;
    }
    round(n) {
        return Math.round(n * 10) / 10;
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], FoodsService);
//# sourceMappingURL=foods.service.js.map