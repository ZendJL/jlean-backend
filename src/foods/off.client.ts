/**
 * Cliente Open Food Facts — Paso 4.4
 * Documentación: https://world.openfoodfacts.org/data
 * Rate limit: ~15 req/min (lectura), ~10 req/min (búsqueda).
 * NO usar search-as-you-type — usar solo por barcode o búsqueda manual.
 */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

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

// Caché en memoria simple
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 30 * 60 * 1000; // 30 min

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
  private readonly baseUrl = 'https://world.openfoodfacts.org';
  private readonly userAgent = 'JLean/1.0 (nutrition web app; contact juanluislpz17@gmail.com)';

  // ─── Por barcode ─────────────────────────────────────────────────────────

  async getByBarcode(barcode: string): Promise<OffFood | null> {
    const cacheKey = `barcode:${barcode}`;
    const cached = fromCache<OffFood>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/api/v3/product/${barcode}.json`;
    const raw = await this.fetchWithRetry<any>(url);
    if (!raw || raw.status === 0) return null;

    const normalized = this.normalize(raw.product);
    if (!normalized) return null;
    toCache(cacheKey, normalized);
    return normalized;
  }

  // ─── Búsqueda manual (NO as-you-type) ───────────────────────────────────

  async search(query: string, page = 1): Promise<OffFood[]> {
    const cacheKey = `search:${query}:${page}`;
    const cached = fromCache<OffFood[]>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}`;
    const raw = await this.fetchWithRetry<any>(url);
    if (!raw || !raw.products) return [];

    const normalized = raw.products
      .map((p: any) => this.normalize(p))
      .filter(Boolean) as OffFood[];

    toCache(cacheKey, normalized);
    return normalized;
  }

  // ─── HTTP con manejo de errores ──────────────────────────────────────────

  private async fetchWithRetry<T>(url: string): Promise<T | null> {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });
    } catch (err) {
      this.logger.error(`OFF fetch error: ${err}`);
      return null; // falla silenciosa — el caller usa catálogo local como fallback
    }

    if (res.status === 429) {
      this.logger.warn('OFF rate limit hit');
      throw new HttpException(
        {
          message: 'Open Food Facts rate limit reached. Please try again shortly.',
          retryAfterSeconds: 10,
          source: 'OFF',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!res.ok) {
      this.logger.error(`OFF error ${res.status}`);
      return null;
    }

    return res.json() as Promise<T>;
  }

  // ─── Normalización + evaluación de calidad ───────────────────────────────

  private normalize(p: any): OffFood | null {
    if (!p) return null;

    const n = p.nutriments ?? {};
    const per100 = (key: string) => {
      // OFF expone _100g y _serving — preferimos _100g para consistencia
      return n[`${key}_100g`] ?? n[key] ?? 0;
    };

    const calories    = per100('energy-kcal');
    const protein     = per100('proteins');
    const carbs       = per100('carbohydrates');
    const fat         = per100('fat');
    const fiber       = per100('fiber') || undefined;
    const sugar       = per100('sugars') || undefined;
    const sodium      = per100('sodium') ? per100('sodium') * 1000 : undefined; // OFF da sodio en g, convertir a mg
    const saturatedFat = per100('saturated-fat') || undefined;
    const servingSizeG = parseFloat(p.serving_size) || 100;

    const qualityStatus = this.evaluateQuality(p, { calories, protein, carbs, fat });

    return {
      barcode:      p.code ?? p._id,
      name:         p.product_name ?? p.generic_name ?? 'Unknown',
      brand:        p.brands,
      servingSizeG,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      saturatedFat,
      qualityStatus,
    };
  }

  /**
   * Reglas de calidad de datos (OFF es user-contributed):
   * COMPLETE     — todos los macros presentes y calorías consistentes con macros
   * PARTIAL      — faltan micros pero macros OK
   * UNVERIFIED   — hay campos vacíos o inconsistencias leves
   * CONFLICTED   — calorías declaradas difieren >15% de las calculadas por macros
   */
  private evaluateQuality(
    p: any,
    { calories, protein, carbs, fat }: { calories: number; protein: number; carbs: number; fat: number },
  ): OffQuality {
    // Si faltan macros básicos → UNVERIFIED
    if (!calories || (!protein && !carbs && !fat)) return 'UNVERIFIED';

    // Verificar consistencia calorías vs macros (proteína×4 + carbs×4 + grasa×9)
    const calculated = protein * 4 + carbs * 4 + fat * 9;
    if (calculated > 0) {
      const diff = Math.abs(calories - calculated) / calculated;
      if (diff > 0.15) return 'CONFLICTED'; // diferencia >15%
    }

    // Si faltan micros (fibra, sodio) → PARTIAL, pero macros OK
    const n = p.nutriments ?? {};
    const hasMicros = n['fiber_100g'] != null || n['sodium_100g'] != null;
    if (!hasMicros) return 'PARTIAL';

    return 'COMPLETE';
  }
}
