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
var OffClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffClient = void 0;
const common_1 = require("@nestjs/common");
const external_api_monitor_service_1 = require("../common/services/external-api-monitor.service");
const USER_AGENT = 'JLean/1.0 (nutrition tracker; juanluislpz17@gmail.com)';
const BASE_URL = 'https://world.openfoodfacts.org';
const cache = new Map();
const TTL_MS = 30 * 60 * 1000;
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
let OffClient = OffClient_1 = class OffClient {
    monitor;
    logger = new common_1.Logger(OffClient_1.name);
    constructor(monitor) {
        this.monitor = monitor;
    }
    async getByBarcode(barcode) {
        const cacheKey = `barcode:${barcode}`;
        const cached = fromCache(cacheKey);
        if (cached)
            return cached;
        const startedAt = Date.now();
        const url = `${BASE_URL}/api/v3/product/${barcode}.json`;
        let res;
        try {
            res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        }
        catch (err) {
            this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, durationMs: Date.now() - startedAt, rateLimited: false });
            this.logger.error(`OFF fetch error: ${err}`);
            return null;
        }
        if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After') ?? '60';
            this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, statusCode: 429, durationMs: Date.now() - startedAt, rateLimited: true });
            throw new common_1.HttpException({ message: 'Open Food Facts rate limit reached. Try again shortly.', retryAfterSeconds: parseInt(retryAfter, 10), source: 'OFF' }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (res.status === 404 || !res.ok) {
            this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
            return null;
        }
        const json = await res.json();
        this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: true, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
        if (json.status === 0 || !json.product)
            throw new common_1.NotFoundException(`Product ${barcode} not found in Open Food Facts`);
        const food = this.normalizeProduct(json.product);
        toCache(cacheKey, food);
        return food;
    }
    async search(query, page = 1, pageSize = 20) {
        const cacheKey = `search:${query}:${page}:${pageSize}`;
        const cached = fromCache(cacheKey);
        if (cached)
            return cached;
        const startedAt = Date.now();
        const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;
        let res;
        try {
            res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        }
        catch (err) {
            this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, durationMs: Date.now() - startedAt, rateLimited: false });
            this.logger.error(`OFF search error: ${err}`);
            return [];
        }
        if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After') ?? '60';
            this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, statusCode: 429, durationMs: Date.now() - startedAt, rateLimited: true });
            throw new common_1.HttpException({ message: 'Open Food Facts rate limit reached. Try again shortly.', retryAfterSeconds: parseInt(retryAfter, 10), source: 'OFF' }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!res.ok) {
            this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
            return [];
        }
        const json = await res.json();
        this.monitor.record({ source: 'OFF', endpoint: 'search', success: true, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
        const results = (json.products ?? []).map((p) => this.normalizeProduct(p));
        toCache(cacheKey, results);
        return results;
    }
    normalizeProduct(p) {
        const n = p.nutriments ?? {};
        const qualityStatus = this.evaluateQuality(n, p.product_name ?? '');
        return {
            barcode: p.code ?? p._id,
            name: p.product_name ?? p.product_name_en ?? 'Unknown product',
            brand: p.brands,
            servingSizeG: parseFloat(p.serving_size) || 100,
            calories: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
            protein: n['proteins_100g'] ?? 0,
            carbs: n['carbohydrates_100g'] ?? 0,
            fat: n['fat_100g'] ?? 0,
            fiber: n['fiber_100g'] ?? undefined,
            sugar: n['sugars_100g'] ?? undefined,
            sodium: n['sodium_100g'] != null ? n['sodium_100g'] * 1000 : undefined,
            saturatedFat: n['saturated-fat_100g'] ?? undefined,
            qualityStatus,
        };
    }
    evaluateQuality(nutriments, productName) {
        const calories = nutriments['energy-kcal_100g'] ?? 0;
        const protein = nutriments['proteins_100g'] ?? 0;
        const carbs = nutriments['carbohydrates_100g'] ?? 0;
        const fat = nutriments['fat_100g'] ?? 0;
        if (!calories || (!protein && !carbs && !fat))
            return 'UNVERIFIED';
        const calculated = protein * 4 + carbs * 4 + fat * 9;
        if (calculated > 0) {
            const diff = Math.abs(calories - calculated) / calculated;
            if (diff > 0.15) {
                this.logger.warn(`OFF CONFLICTED: ${productName} — declared ${calories} kcal, calculated ${calculated.toFixed(1)} kcal`);
                return 'CONFLICTED';
            }
        }
        const hasMicros = nutriments['fiber_100g'] != null || nutriments['sodium_100g'] != null;
        if (!hasMicros)
            return 'PARTIAL';
        return 'COMPLETE';
    }
};
exports.OffClient = OffClient;
exports.OffClient = OffClient = OffClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [external_api_monitor_service_1.ExternalApiMonitorService])
], OffClient);
//# sourceMappingURL=off.client.js.map