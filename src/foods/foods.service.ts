import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FoodSource } from '@prisma/client'
import { UsdaService } from './usda.service'
import { OffService } from './off.service'

@Injectable()
export class FoodsService {
  constructor(
    private prisma:   PrismaService,
    private usda:     UsdaService,
    private offSvc:   OffService,
  ) {}

  // ─── Catálogo interno ────────────────────────────────────────────────────────

  findAll(query?: string) {
    return this.prisma.food.findMany({
      where: query ? { name: { contains: query, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
      take: 50,
    })
  }

  findOne(id: string) {
    return this.prisma.food.findUnique({ where: { id } })
  }

  create(dto: any) {
    return this.prisma.food.create({ data: dto })
  }

  update(id: string, dto: any) {
    return this.prisma.food.update({ where: { id }, data: dto })
  }

  remove(id: string) {
    return this.prisma.food.delete({ where: { id } })
  }

  // ─── USDA ─────────────────────────────────────────────────────────────────────

  async searchUsda(query: string) {
    return this.usda.search(query)
  }

  async importUsda(fdcId: string) {
    const existing = await this.prisma.food.findFirst({
      where: { externalId: fdcId, source: FoodSource.USDA },
    })
    if (existing) return existing

    const raw = await this.usda.getFood(fdcId)
    return this.prisma.food.create({ data: this.usda.normalize(raw) })
  }

  // ─── Open Food Facts ─────────────────────────────────────────────────────────

  async searchOff(query: string) {
    return this.offSvc.search(query)
  }

  async importByBarcode(barcode: string) {
    const existing = await this.prisma.food.findFirst({
      where: { externalId: barcode, source: FoodSource.OFF },
    })
    if (existing) return existing

    const raw = await this.offSvc.getByBarcode(barcode)
    return this.prisma.food.create({
      data: {
        name:         raw.product_name ?? 'Unknown',
        brand:        raw.brands       ?? null,
        source:       FoodSource.OFF,
        externalId:   barcode,
        barcode,
        servingSizeG: raw.serving_size_imported ?? 100,
        calories:     raw.nutriments?.['energy-kcal_100g'] ?? 0,
        protein:      raw.nutriments?.proteins_100g        ?? 0,
        carbs:        raw.nutriments?.carbohydrates_100g   ?? 0,
        fat:          raw.nutriments?.fat_100g             ?? 0,
        fiber:        raw.nutriments?.fiber_100g           ?? null,
        sugar:        raw.nutriments?.sugars_100g          ?? null,
        sodium:       raw.nutriments?.sodium_100g          ?? null,
      },
    })
  }
}
