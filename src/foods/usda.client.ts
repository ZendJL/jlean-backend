/**
 * Cliente USDA FoodData Central — Paso 4.3 (con ExternalApiMonitorService)
 * Documentación: https://api.nal.usda.gov/fdc/v1
 * Rate limit: 1,000 req/hora/IP — exponemos headers x-ratelimit-* al caller.
 */
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service';

export interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  caffeineMg?: number;
}

// Caché en memoria simple (clave → { data, expiresAt })
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hora

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}

function toCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

@Injectable()
export class UsdaClient {
  private readonly logger = new Logger(UsdaClient.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor(
    private config: ConfigService,
    private monitor: ExternalApiMonitorService,
  ) {
    this.apiKey = this.config.get<string>('USDA_API_KEY', 'DEMO_KEY');
  }

  // ─── Búsqueda por texto ──────────────────────────────────────────────────

  async search(query: string, pageSize = 20): Promise<UsdaFood[]> {
    const cacheKey = `search:${query}:${pageSize}`;
    const cached = fromCache<UsdaFood[]>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy,Branded`;

    const result = await this.fetchWithRateLimit<any>(url, 'search');
    if (!result) return [];

    const normalized = (result.foods ?? []).map((f: any) => this.normalizeSearchItem(f));
    toCache(cacheKey, normalized);
    return normalized;
  }

  // ─── Detalle por fdcId ───────────────────────────────────────────────────

  async getDetail(fdcId: string): Promise<UsdaFood | null> {
    const cacheKey = `detail:${fdcId}`;
    const cached = fromCache<UsdaFood>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
    const result = await this.fetchWithRateLimit<any>(url, `detail/${fdcId}`);
    if (!result) return null;

    const normalized = this.normalizeDetail(result);
    toCache(cacheKey, normalized);
    return normalized;
  }

  // ─── HTTP con manejo de 429 y telemetría ─────────────────────────────────

  private async fetchWithRateLimit<T>(url: string, endpoint: string): Promise<T | null> {
    const startedAt = Date.now();
    let res: Response;

    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'JLean/1.0 (nutrition app; contact juanluislpz17@gmail.com)' },
      });
    } catch (err) {
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
      throw new HttpException(
        {
          message: 'USDA rate limit reached. Please try again shortly.',
          retryAfterSeconds: parseInt(retryAfter, 10),
          source: 'USDA',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
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

    return res.json() as Promise<T>;
  }

  // ─── Normalizadores ──────────────────────────────────────────────────────

  private getNutrientValue(nutrients: any[], nutrientId: number): number {
    const n = nutrients?.find((x: any) => x.nutrientId === nutrientId || x.number === String(nutrientId));
    return n ? (n.value ?? n.amount ?? 0) : 0;
  }

  private normalizeSearchItem(f: any): UsdaFood {
    const nn = f.foodNutrients ?? [];
    return {
      fdcId:           f.fdcId,
      description:     f.description,
      brandOwner:      f.brandOwner,
      calories:        this.getNutrientValue(nn, 1008),
      protein:         this.getNutrientValue(nn, 1003),
      carbs:           this.getNutrientValue(nn, 1005),
      fat:             this.getNutrientValue(nn, 1004),
      fiber:           this.getNutrientValue(nn, 1079) || undefined,
      sugar:           this.getNutrientValue(nn, 2000) || undefined,
      sodium:          this.getNutrientValue(nn, 1093) || undefined,
      saturatedFat:    this.getNutrientValue(nn, 1258) || undefined,
      caffeineMg:      this.getNutrientValue(nn, 1057) || undefined,
      servingSize:     f.servingSize,
      servingSizeUnit: f.servingSizeUnit,
    };
  }

  private normalizeDetail(f: any): UsdaFood {
    const nn = f.foodNutrients ?? [];
    const getVal = (id: number) => {
      const n = nn.find((x: any) => x.nutrient?.id === id);
      return n ? (n.amount ?? 0) : 0;
    };
    return {
      fdcId:           f.fdcId,
      description:     f.description,
      brandOwner:      f.brandOwner,
      calories:        getVal(1008),
      protein:         getVal(1003),
      carbs:           getVal(1005),
      fat:             getVal(1004),
      fiber:           getVal(1079) || undefined,
      sugar:           getVal(2000) || undefined,
      sodium:          getVal(1093) || undefined,
      saturatedFat:    getVal(1258) || undefined,
      caffeineMg:      getVal(1057) || undefined,
      servingSize:     f.servingSize,
      servingSizeUnit: f.servingSizeUnit,
    };
  }
}
