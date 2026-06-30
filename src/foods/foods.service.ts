/**
 * FoodsService — Paso 4.2, 4.3, 4.4, 4.5
 * Servicio unificado: catálogo local + USDA + Open Food Facts.
 * Prioridad de búsqueda: local (presets + custom) → externo si se solicita.
 * Importación con deduplicación por (source, externalId).
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FoodSource, DataQuality } from '@prisma/client'
import { UsdaClient, UsdaFood } from './usda.client'
import { OffClient, OffFood } from './off.client'

export interface CreateFoodDto {
  name: string
  brand?: string
  servingSizeG?: number
  servingUnit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  saturatedFat?: number
  caffeineMg?: number
  alcoholG?: number
  barcode?: string
}

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name)

  constructor(
    private prisma: PrismaService,
    private usda: UsdaClient,
    private off: OffClient,
  ) {}

  // ─── Búsqueda unificada ──────────────────────────────────────────────────

  /**
   * source='local' → solo catálogo propio (presets + custom)
   * source='usda'  → busca en USDA, con fallback a local si falla
   * source='off'   → busca en OFF, con fallback a local si falla
   */
  async search(query: string, source: 'local' | 'usda' | 'off' = 'local') {
    if (source === 'usda') {
      try {
        const results = await this.usda.search(query)
        return results.map(this.mapUsdaToView)
      } catch (err: any) {
        // Si es 429, re-lanzar para que el controller lo propague al frontend
        if (err?.status === 429) throw err
        // Cualquier otro error → fallback al catálogo local
        this.logger.warn(`USDA search failed, falling back to local: ${err?.message}`)
        return this.searchLocal(query)
      }
    }

    if (source === 'off') {
      try {
        const results = await this.off.search(query)
        return results.map(this.mapOffToView)
      } catch (err: any) {
        if (err?.status === 429) throw err
        this.logger.warn(`OFF search failed, falling back to local: ${err?.message}`)
        return this.searchLocal(query)
      }
    }

    return this.searchLocal(query)
  }

  private async searchLocal(query: string) {
    return this.prisma.food.findMany({
      where:   { name: { contains: query, mode: 'insensitive' } },
      orderBy: [
        // presets primero, luego custom, luego importados
        { source: 'asc' },
        { name:   'asc'  },
      ],
      take: 50,
    })
  }

  // ─── Por barcode ─────────────────────────────────────────────────────────

  async getByBarcode(barcode: string) {
    // 1. Buscar en caché local
    const cached = await this.prisma.food.findFirst({ where: { barcode } })
    if (cached) return cached

    // 2. Fallback: OFF por barcode → importar y persistir
    const offFood = await this.off.getByBarcode(barcode)
    if (!offFood) throw new NotFoundException(`Food with barcode ${barcode} not found`)

    return this.importOffFood(offFood)
  }

  // ─── Detalle ─────────────────────────────────────────────────────────────

  async getById(id: string) {
    const food = await this.prisma.food.findUnique({ where: { id } })
    if (!food) throw new NotFoundException(`Food ${id} not found`)
    return food
  }

  // ─── Importar desde USDA ─────────────────────────────────────────────────

  async importFromUsda(fdcId: string) {
    // Deduplicación: si ya existe en BD, retornar
    const existing = await this.prisma.food.findFirst({
      where: { source: FoodSource.USDA, externalId: String(fdcId) },
    })
    if (existing) return existing

    const detail = await this.usda.getDetail(fdcId)
    if (!detail) throw new NotFoundException(`USDA food ${fdcId} not found`)

    return this.prisma.food.create({
      data: {
        name:         detail.description,
        source:       FoodSource.USDA,
        externalId:   String(detail.fdcId),
        brand:        detail.brandOwner,
        servingSizeG: detail.servingSize ?? 100,
        servingUnit:  detail.servingSizeUnit ?? 'g',
        calories:     detail.calories,
        protein:      detail.protein,
        carbs:        detail.carbs,
        fat:          detail.fat,
        fiber:        detail.fiber,
        sugar:        detail.sugar,
        sodium:       detail.sodium,
        saturatedFat: detail.saturatedFat,
        caffeineMg:   detail.caffeineMg,
        qualityStatus: DataQuality.COMPLETE,
      },
    })
  }

  // ─── Importar desde OFF ──────────────────────────────────────────────────

  private async importOffFood(offFood: OffFood) {
    // Deduplicación
    const existing = await this.prisma.food.findFirst({
      where: { source: FoodSource.OFF, externalId: offFood.barcode },
    })
    if (existing) return existing

    return this.prisma.food.create({
      data: {
        name:         offFood.name,
        brand:        offFood.brand,
        source:       FoodSource.OFF,
        externalId:   offFood.barcode,
        barcode:      offFood.barcode,
        servingSizeG: offFood.servingSizeG,
        servingUnit:  'g',
        calories:     offFood.calories,
        protein:      offFood.protein,
        carbs:        offFood.carbs,
        fat:          offFood.fat,
        fiber:        offFood.fiber,
        sugar:        offFood.sugar,
        sodium:       offFood.sodium,
        saturatedFat: offFood.saturatedFat,
        qualityStatus: offFood.qualityStatus as DataQuality,
      },
    })
  }

  // ─── Crear alimento personalizado ────────────────────────────────────────

  async createCustomFood(dto: CreateFoodDto) {
    return this.prisma.food.create({
      data: {
        ...dto,
        source: FoodSource.CUSTOM,
        qualityStatus: DataQuality.COMPLETE,
      },
    })
  }

  // ─── Mappers para vistas (no persisten) ──────────────────────────────────

  private mapUsdaToView(f: UsdaFood) {
    return {
      id:           `usda-${f.fdcId}`,
      name:         f.description,
      brand:        f.brandOwner,
      source:       'USDA',
      externalId:   String(f.fdcId),
      servingSizeG: f.servingSize ?? 100,
      servingUnit:  f.servingSizeUnit ?? 'g',
      calories:     f.calories,
      protein:      f.protein,
      carbs:        f.carbs,
      fat:          f.fat,
      fiber:        f.fiber,
      sugar:        f.sugar,
      sodium:       f.sodium,
      saturatedFat: f.saturatedFat,
      caffeineMg:   f.caffeineMg,
      qualityStatus: 'COMPLETE',
    }
  }

  private mapOffToView(f: OffFood) {
    return {
      id:           `off-${f.barcode}`,
      name:         f.name,
      brand:        f.brand,
      source:       'OFF',
      externalId:   f.barcode,
      barcode:      f.barcode,
      servingSizeG: f.servingSizeG,
      servingUnit:  'g',
      calories:     f.calories,
      protein:      f.protein,
      carbs:        f.carbs,
      fat:          f.fat,
      fiber:        f.fiber,
      sugar:        f.sugar,
      sodium:       f.sodium,
      saturatedFat: f.saturatedFat,
      qualityStatus: f.qualityStatus,
    }
  }
}
