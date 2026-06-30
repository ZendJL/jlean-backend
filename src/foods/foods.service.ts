import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FoodSource } from '@prisma/client'
import { ImportFoodDto } from './dto/import-food.dto'

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  // ─── search ──────────────────────────────────────────────────────────────────

  async search(query: string, source: 'local' | 'usda' | 'off' = 'local') {
    if (source === 'usda') return this.searchUsda(query)
    if (source === 'off')  return this.searchOff(query)

    // local: busca en catálogo propio (presets + custom)
    return this.prisma.food.findMany({
      where:   { name: { contains: query, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take:    50,
    })
  }

  // ─── getByBarcode ─────────────────────────────────────────────────────────

  async getByBarcode(barcode: string) {
    // 1. buscar en caché local
    const cached = await this.prisma.food.findFirst({ where: { barcode } })
    if (cached) return cached

    // 2. fallback: consultar Open Food Facts
    return this.importFromOff(barcode)
  }

  // ─── importFood ───────────────────────────────────────────────────────────

  async importFood(dto: ImportFoodDto) {
    if (dto.source === 'USDA' && dto.externalId) {
      return this.importFromUsda(dto.externalId)
    }
    if (dto.source === 'OFF' && dto.externalId) {
      return this.importFromOff(dto.externalId)
    }
    // custom food creation
    return this.prisma.food.create({ data: { ...dto } as any })
  }

  // ─── getById ─────────────────────────────────────────────────────────────────

  async getById(id: string) {
    const food = await this.prisma.food.findUnique({ where: { id } })
    if (!food) throw new NotFoundException(`Food ${id} not found`)
    return food
  }

  // ─── USDA (stub — implementar en Fase 4.3) ──────────────────────────────────────────

  private async searchUsda(query: string) {
    // TODO Fase 4.3 — integrar USDA FoodData Central API
    return []
  }

  private async importFromUsda(fdcId: string) {
    const existing = await this.prisma.food.findFirst({
      where: { externalId: fdcId, source: FoodSource.USDA },
    })
    if (existing) return existing
    // TODO Fase 4.3 — llamar USDA API y normalizar
    throw new NotFoundException('USDA integration not yet implemented')
  }

  // ─── Open Food Facts (stub — implementar en Fase 4.4) ───────────────────────────

  private async searchOff(query: string) {
    // TODO Fase 4.4 — integrar Open Food Facts search
    return []
  }

  private async importFromOff(barcode: string) {
    const existing = await this.prisma.food.findFirst({
      where: { externalId: barcode, source: FoodSource.OFF },
    })
    if (existing) return existing
    // TODO Fase 4.4 — llamar OFF API por barcode
    throw new NotFoundException('Open Food Facts integration not yet implemented')
  }
}
