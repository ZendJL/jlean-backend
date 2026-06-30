import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FoodsService {
  private readonly usdaBase = 'https://api.nal.usda.gov/fdc/v1';
  private readonly offBase = 'https://world.openfoodfacts.org/cgi/search.pl';

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

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
    const url = `${this.usdaBase}/foods/search`;
    const { data } = await firstValueFrom(
      this.http.get(url, { params: { query: q, api_key: apiKey, pageSize: 20 } }),
    );
    return (data.foods ?? []).map((f: any) => ({
      externalId: String(f.fdcId),
      source: 'USDA',
      name: f.description,
      brand: f.brandOwner ?? null,
      calories: this.getNutrient(f.foodNutrients, 1008),
      protein:  this.getNutrient(f.foodNutrients, 1003),
      carbs:    this.getNutrient(f.foodNutrients, 1005),
      fat:      this.getNutrient(f.foodNutrients, 1004),
      servingSizeG: f.servingSize ?? 100,
    }));
  }

  private async searchOff(q: string) {
    const { data } = await firstValueFrom(
      this.http.get(this.offBase, {
        params: { search_terms: q, json: 1, page_size: 20 },
      }),
    );
    return (data.products ?? []).map((p: any) => ({
      externalId: p.id,
      source: 'OFF',
      name: p.product_name ?? p.product_name_en ?? 'Unknown',
      brand: p.brands ?? null,
      calories: p.nutriments?.['energy-kcal_100g'] ?? 0,
      protein:  p.nutriments?.protein_100g ?? 0,
      carbs:    p.nutriments?.carbohydrates_100g ?? 0,
      fat:      p.nutriments?.fat_100g ?? 0,
      servingSizeG: 100,
    }));
  }

  async importFood(dto: {
    externalId: string;
    source: string;
    name: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSizeG?: number;
  }) {
    return this.prisma.food.upsert({
      where: { externalId_source: { externalId: dto.externalId, source: dto.source } },
      update: {},
      create: {
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

  private getNutrient(nutrients: any[], nutrientId: number): number {
    const n = nutrients?.find((x: any) => x.nutrientId === nutrientId);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }
}
