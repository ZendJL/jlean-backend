/**
 * FoodsService — Paso 4.2, 4.3, 4.4, 4.5
 * Servicio unificado: catálogo local + USDA + Open Food Facts.
 * Prioridad de búsqueda: local (presets + custom) → externo si se solicita.
 *
 * F-01 FIX: deduplicación robusta por (source + externalId) antes de importar.
 * F-03 FIX: fallback a catálogo interno si USDA falla por red (no solo 429).
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
   * source='usda'  → busca en USDA; si falla (red/5xx) → fallback a local.
   *                  Si falla con 429 → re-lanza para que el frontend avise al usuario.
   * source='off'   → busca en OFF; mismo comportamiento que USDA.
   */
  async search(query: string, source: 'local' | 'usda' | 'off' = 'local') {
    if (source === 'usda') {
      try {
        const results = await this.usda.search(query)
        return results.map(this.mapUsdaToView)
      } catch (err: any) {
        // 429: propagar para que el controller lo exponga al frontend
        if (err?.status === 429 || err?.getStatus?.() === 429) throw err
        // F-03: cualquier otro error de red / 5xx → fallback silencioso
        this.logger.warn(`USDA search falló (${err?.message ?? err}), usando catálogo local como fallback`)
        return this.searchLocal(query)
      }
    }

    if (source === 'off') {
      try {
        const results = await this.off.search(query)
        return results.map(this.mapOffToView)
      } catch (err: any) {
        if (err?.status === 429 || err?.getStatus?.() === 429) throw err
        this.logger.warn(`OFF search falló (${err?.message ?? err}), usando catálogo local como fallback`)
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
    // F-01 FIX: deduplicación por (source=USDA + externalId=fdcId) — evita duplicados
    // aunque el nombre cambie entre llamadas a la API.
    const existing = await this.prisma.food.findFirst({
      where: { source: FoodSource.USDA, externalId: String(fdcId) },
    })
    if (existing) {
      this.logger.log(`USDA food fdcId=${fdcId} ya existe en BD (id=${existing.id}), retornando existente`)
      return existing
    }

    let detail: UsdaFood | null = null
    try {
      detail = await this.usda.getDetail(fdcId)
    } catch (err: any) {
      // F-03: si USDA no responde, no crashear — retornar null para que el caller decida
      if (err?.status === 429 || err?.getStatus?.() === 429) throw err
      this.logger.warn(`USDA getDetail fdcId=${fdcId} falló: ${err?.message}`)
      throw new NotFoundException(`No se pudo obtener el alimento USDA ${fdcId}. Intenta más tarde.`)
    }

    if (!detail) throw new NotFoundException(`USDA food ${fdcId} not found`)

    this.logger.log(`Importando USDA food fdcId=${fdcId} → "${detail.description}"`)

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
    // F-01 FIX: deduplicación por (source=OFF + externalId=barcode)
    const existing = await this.prisma.food.findFirst({
      where: { source: FoodSource.OFF, externalId: offFood.barcode },
    })
    if (existing) {
      this.logger.log(`OFF food barcode=${offFood.barcode} ya existe (id=${existing.id}), retornando existente`)
      return existing
    }

    this.logger.log(`Importando OFF food barcode=${offFood.barcode} → "${offFood.name}"`)

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
