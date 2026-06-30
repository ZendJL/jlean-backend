/**
 * Cliente Open Food Facts — Paso 4.4 (con ExternalApiMonitorService)
 * Rate limit: ~15 req/min lectura, ~10 req/min búsqueda.
 * NO usar search-as-you-type. User-Agent requerido.
 */
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service';

export type OffQuality = 'COMPLETE' | 'PARTIAL' | 'UNVERIFIED' | 'CONFLICTED';

export interface OffFood {
  barcode: string;
  name: string;
  brand?: string;
  servingSizeG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  qualityStatus: OffQuality;
}

const USER_AGENT = 'JLean/1.0 (nutrition tracker; juanluislpz17@gmail.com)';
const BASE_URL   = 'https://world.openfoodfacts.org';

// Caché en memoria (TTL 30 min para OFF — los datos cambian más frecuentemente)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 30 * 60 * 1000;

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
export class OffClient {
  private readonly logger = new Logger(OffClient.name);

  constructor(private monitor: ExternalApiMonitorService) {}

  // ─── Por barcode (lookup directo) ───────────────────────────────────────

  async getByBarcode(barcode: string): Promise<OffFood | null> {
    const cacheKey = `barcode:${barcode}`;
    const cached = fromCache<OffFood>(cacheKey);
    if (cached) return cached;

    const startedAt = Date.now();
    const url = `${BASE_URL}/api/v3/product/${barcode}.json`;

    let res: Response;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch (err) {
      this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, durationMs: Date.now() - startedAt, rateLimited: false });
      this.logger.error(`OFF fetch error: ${err}`);
      return null;
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') ?? '60';
      this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, statusCode: 429, durationMs: Date.now() - startedAt, rateLimited: true });
      throw new HttpException(
        { message: 'Open Food Facts rate limit reached. Try again shortly.', retryAfterSeconds: parseInt(retryAfter, 10), source: 'OFF' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (res.status === 404 || !res.ok) {
      this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: false, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
      return null;
    }

    const json = await res.json() as any;
    this.monitor.record({ source: 'OFF', endpoint: `product/${barcode}`, success: true, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });

    if (json.status === 0 || !json.product) throw new NotFoundException(`Product ${barcode} not found in Open Food Facts`);

    const food = this.normalizeProduct(json.product);
    toCache(cacheKey, food);
    return food;
  }

  // ─── Búsqueda manual (NO as-you-type) ────────────────────────────────────

  async search(query: string, page = 1, pageSize = 20): Promise<OffFood[]> {
    const cacheKey = `search:${query}:${page}:${pageSize}`;
    const cached = fromCache<OffFood[]>(cacheKey);
    if (cached) return cached;

    const startedAt = Date.now();
    const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;

    let res: Response;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch (err) {
      this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, durationMs: Date.now() - startedAt, rateLimited: false });
      this.logger.error(`OFF search error: ${err}`);
      return [];
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') ?? '60';
      this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, statusCode: 429, durationMs: Date.now() - startedAt, rateLimited: true });
      throw new HttpException(
        { message: 'Open Food Facts rate limit reached. Try again shortly.', retryAfterSeconds: parseInt(retryAfter, 10), source: 'OFF' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!res.ok) {
      this.monitor.record({ source: 'OFF', endpoint: 'search', success: false, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });
      return [];
    }

    const json = await res.json() as any;
    this.monitor.record({ source: 'OFF', endpoint: 'search', success: true, statusCode: res.status, durationMs: Date.now() - startedAt, rateLimited: false });

    const results = (json.products ?? []).map((p: any) => this.normalizeProduct(p));
    toCache(cacheKey, results);
    return results;
  }

  // ─── Normalizador ────────────────────────────────────────────────────────

  private normalizeProduct(p: any): OffFood {
    const n = p.nutriments ?? {};
    const qualityStatus = this.evaluateQuality(n, p.product_name ?? '');
    return {
      barcode:      p.code ?? p._id,
      name:         p.product_name ?? p.product_name_en ?? 'Unknown product',
      brand:        p.brands,
      servingSizeG: parseFloat(p.serving_size) || 100,
      calories:     n['energy-kcal_100g']     ?? n['energy-kcal'] ?? 0,
      protein:      n['proteins_100g']         ?? 0,
      carbs:        n['carbohydrates_100g']     ?? 0,
      fat:          n['fat_100g']               ?? 0,
      fiber:        n['fiber_100g']             ?? undefined,
      sugar:        n['sugars_100g']            ?? undefined,
      sodium:       n['sodium_100g'] != null ? n['sodium_100g'] * 1000 : undefined, // g→mg
      saturatedFat: n['saturated-fat_100g']     ?? undefined,
      qualityStatus,
    };
  }

  /**
   * Evalúa la calidad de los datos OFF:
   * COMPLETE   — macros + micros presentes y consistentes
   * PARTIAL    — macros OK pero faltan micros (fibra, sodio)
   * UNVERIFIED — datos incompletos o cero en macros clave
   * CONFLICTED — discrepancia >15% entre kcal declaradas y calculadas
   */
  evaluateQuality(nutriments: Record<string, number>, productName: string): OffQuality {
    const calories = nutriments['energy-kcal_100g'] ?? 0;
    const protein  = nutriments['proteins_100g']    ?? 0;
    const carbs    = nutriments['carbohydrates_100g'] ?? 0;
    const fat      = nutriments['fat_100g']          ?? 0;

    if (!calories || (!protein && !carbs && !fat)) return 'UNVERIFIED';

    const calculated = protein * 4 + carbs * 4 + fat * 9;
    if (calculated > 0) {
      const diff = Math.abs(calories - calculated) / calculated;
      if (diff > 0.15) {
        this.logger.warn(`OFF CONFLICTED: ${productName} — declared ${calories} kcal, calculated ${calculated.toFixed(1)} kcal`);
        return 'CONFLICTED';
      }
    }

    const hasMicros = nutriments['fiber_100g'] != null || nutriments['sodium_100g'] != null;
    if (!hasMicros) return 'PARTIAL';

    return 'COMPLETE';
  }
}
