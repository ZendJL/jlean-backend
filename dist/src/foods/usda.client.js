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
var UsdaClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdaClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const external_api_monitor_service_1 = require("../common/services/external-api-monitor.service");
const cache = new Map();
const TTL_MS = 60 * 60 * 1000;
function fromCache(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function toCache(key, data) {
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}
let UsdaClient = UsdaClient_1 = class UsdaClient {
    config;
    monitor;
    logger = new common_1.Logger(UsdaClient_1.name);
    apiKey;
    baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    constructor(config, monitor) {
        this.config = config;
        this.monitor = monitor;
        this.apiKey = this.config.get('USDA_API_KEY', 'DEMO_KEY');
    }
    async search(query, pageSize = 20) {
        const cacheKey = `search:${query}:${pageSize}`;
        const cached = fromCache(cacheKey);
        if (cached)
            return cached;
        const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy,Branded`;
        const result = await this.fetchWithRateLimit(url, 'search');
        if (!result)
            return [];
        const normalized = (result.foods ?? []).map((f) => this.normalizeSearchItem(f));
        toCache(cacheKey, normalized);
        return normalized;
    }
    async getDetail(fdcId) {
        const cacheKey = `detail:${fdcId}`;
        const cached = fromCache(cacheKey);
        if (cached)
            return cached;
        const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
        const result = await this.fetchWithRateLimit(url, `detail/${fdcId}`);
        if (!result)
            return null;
        const normalized = this.normalizeDetail(result);
        toCache(cacheKey, normalized);
        return normalized;
    }
    async fetchWithRateLimit(url, endpoint) {
        const startedAt = Date.now();
        let res;
        try {
            res = await fetch(url, {
                headers: { 'User-Agent': 'JLean/1.0 (nutrition app; contact juanluislpz17@gmail.com)' },
            });
        }
        catch (err) {
            this.monitor.record({
                source: 'USDA', endpoint, success: false,
                durationMs: Date.now() - startedAt, rateLimited: false,
            });
            this.logger.error(`USDA fetch error: ${err}`);
            return null;
        }
        if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After') ?? '60';
            this.monitor.record({
                source: 'USDA', endpoint, success: false, statusCode: 429,
                durationMs: Date.now() - startedAt, rateLimited: true,
            });
            this.logger.warn(`USDA rate limit hit. Retry-After: ${retryAfter}s`);
            throw new common_1.HttpException({
                message: 'USDA rate limit reached. Please try again shortly.',
                retryAfterSeconds: parseInt(retryAfter, 10),
                source: 'USDA',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!res.ok) {
            this.monitor.record({
                source: 'USDA', endpoint, success: false, statusCode: res.status,
                durationMs: Date.now() - startedAt, rateLimited: false,
            });
            this.logger.error(`USDA error ${res.status} for URL: ${url}`);
            return null;
        }
        this.monitor.record({
            source: 'USDA', endpoint, success: true, statusCode: res.status,
            durationMs: Date.now() - startedAt, rateLimited: false,
        });
        return res.json();
    }
    getNutrientValue(nutrients, nutrientId) {
        const n = nutrients?.find((x) => x.nutrientId === nutrientId || x.number === String(nutrientId));
        return n ? (n.value ?? n.amount ?? 0) : 0;
    }
    normalizeSearchItem(f) {
        const nn = f.foodNutrients ?? [];
        return {
            fdcId: f.fdcId,
            description: f.description,
            brandOwner: f.brandOwner,
            calories: this.getNutrientValue(nn, 1008),
            protein: this.getNutrientValue(nn, 1003),
            carbs: this.getNutrientValue(nn, 1005),
            fat: this.getNutrientValue(nn, 1004),
            fiber: this.getNutrientValue(nn, 1079) || undefined,
            sugar: this.getNutrientValue(nn, 2000) || undefined,
            sodium: this.getNutrientValue(nn, 1093) || undefined,
            saturatedFat: this.getNutrientValue(nn, 1258) || undefined,
            caffeineMg: this.getNutrientValue(nn, 1057) || undefined,
            servingSize: f.servingSize,
            servingSizeUnit: f.servingSizeUnit,
        };
    }
    normalizeDetail(f) {
        const nn = f.foodNutrients ?? [];
        const getVal = (id) => {
            const n = nn.find((x) => x.nutrient?.id === id);
            return n ? (n.amount ?? 0) : 0;
        };
        return {
            fdcId: f.fdcId,
            description: f.description,
            brandOwner: f.brandOwner,
            calories: getVal(1008),
            protein: getVal(1003),
            carbs: getVal(1005),
            fat: getVal(1004),
            fiber: getVal(1079) || undefined,
            sugar: getVal(2000) || undefined,
            sodium: getVal(1093) || undefined,
            saturatedFat: getVal(1258) || undefined,
            caffeineMg: getVal(1057) || undefined,
            servingSize: f.servingSize,
            servingSizeUnit: f.servingSizeUnit,
        };
    }
};
exports.UsdaClient = UsdaClient;
exports.UsdaClient = UsdaClient = UsdaClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        external_api_monitor_service_1.ExternalApiMonitorService])
], UsdaClient);
//# sourceMappingURL=usda.client.js.map