import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FoodSource } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FoodsService {
  private readonly usdaBase = 'https://api.nal.usda.gov/fdc/v1';
  private readonly offBase  = 'https://world.openfoodfacts.org/cgi/search.pl';
  private readonly offItem  = 'https://world.openfoodfacts.org/api/v2/product';

  constructor(
    private http:   HttpService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ─── Search ──────────────────────────────────────────────────────────────

  async search(q: string, source: 'local' | 'usda' | 'off' = 'local') {
    if (source === 'usda') return this.searchUsda(q);
    if (source === 'off')  return this.searchOff(q);
    return this.searchLocal(q);
  }

  private async searchLocal(q: string) {
    return this.prisma.food.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      take: 20,
    });
  }

  private async searchUsda(q: string) {
    const apiKey = this.config.get<string>('USDA_FDC_API_KEY');
    const url = this.usdaBase + '/foods/search';
    const { data } = await firstValueFrom(
      this.http.get(url, { params: { query: q, api_key: apiKey, pageSize: 20 } }),
    );
    return (data.foods ?? []).map((f: any) => ({
      externalId:   String(f.fdcId),
      source:       FoodSource.USDA,
      name:         f.description,
      brand:        f.brandOwner ?? null,
      calories:     this.getNutrient(f.foodNutrients, 1008),
      protein:      this.getNutrient(f.foodNutrients, 1003),
      carbs:        this.getNutrient(f.foodNutrients, 1005),
      fat:          this.getNutrient(f.foodNutrients, 1004),
      servingSizeG: f.servingSize ?? 100,
    }));
  }

  private async searchOff(q: string) {
    const { data } = await firstValueFrom(
      this.http.get(this.offBase, {
        params: { search_terms: q, json: 1, page_size: 20 },
      }),
    );
    return (data.products ?? []).map((p: any) => this.mapOffProduct(p));
  }

  // ─── Barcode ─────────────────────────────────────────────────────────────

  async getByBarcode(barcode: string) {
    // 1. Buscar primero en DB local por externalId
    const cached = await this.prisma.food.findFirst({
      where: { externalId: barcode, source: FoodSource.OFF },
    });
    if (cached) return cached;

    // 2. Consultar Open Food Facts
    const url = `${this.offItem}/${barcode}.json`;
    let data: any;
    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          params: { fields: 'product_name,brands,nutriments,serving_size,image_url' },
        }),
      );
      data = res.data;
    } catch {
      throw new NotFoundException(`Producto con código ${barcode} no encontrado`);
    }

    if (data.status !== 1 || !data.product)
      throw new NotFoundException(`Producto con código ${barcode} no encontrado`);

    return this.mapOffProduct({ ...data.product, id: barcode });
  }

  // ─── Import ──────────────────────────────────────────────────────────────

  async importFood(dto: {
    externalId:   string;
    source:       FoodSource;
    name:         string;
    brand?:       string;
    calories:     number;
    protein:      number;
    carbs:        number;
    fat:          number;
    servingSizeG?: number;
  }) {
    const existing = await this.prisma.food.findFirst({
      where: { externalId: dto.externalId, source: dto.source },
    });
    if (existing) return existing;

    return this.prisma.food.create({
      data: {
        externalId:   dto.externalId,
        source:       dto.source,
        name:         dto.name,
        brand:        dto.brand,
        calories:     dto.calories,
        protein:      dto.protein,
        carbs:        dto.carbs,
        fat:          dto.fat,
        servingSizeG: dto.servingSizeG ?? 100,
      },
    });
  }

  async getById(id: string) {
    const food = await this.prisma.food.findUnique({ where: { id } });
    if (!food) throw new NotFoundException('Alimento no encontrado');
    return food;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private mapOffProduct(p: any) {
    return {
      externalId:   String(p.id ?? p._id ?? ''),
      source:       FoodSource.OFF,
      name:         p.product_name ?? p.product_name_en ?? 'Unknown',
      brand:        p.brands ?? null,
      calories:     this.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
      protein:      this.round(p.nutriments?.protein_100g         ?? 0),
      carbs:        this.round(p.nutriments?.carbohydrates_100g   ?? 0),
      fat:          this.round(p.nutriments?.fat_100g             ?? 0),
      servingSizeG: this.parseServingSize(p.serving_size) ?? 100,
      imageUrl:     p.image_url ?? null,
    };
  }

  private parseServingSize(raw: string | undefined): number | null {
    if (!raw) return null;
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  private getNutrient(nutrients: any[], nutrientId: number): number {
    const n = nutrients?.find((x: any) => x.nutrientId === nutrientId);
    return n ? this.round(n.value) : 0;
  }

  private round(n: number) {
    return Math.round(n * 10) / 10;
  }
}
