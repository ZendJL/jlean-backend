/**
 * Tests del FoodsService — Fase 12.1
 * Cubre: search (local/USDA fallback F-03), importFromUsda (deduplicación F-01),
 *        getByBarcode, createCustomFood, sort de presets (F-05),
 *        mapUsdaToView y mapOffToView como métodos estáticos (F-04).
 */
import { FoodsService } from './foods.service'
import { NotFoundException } from '@nestjs/common'

function buildService(prismaOverrides = {}, usdaOverrides = {}, offOverrides = {}) {
  const prisma: any = {
    food: {
      findMany:   jest.fn(),
      findFirst:  jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
    },
    ...prismaOverrides,
  }
  const usda: any = {
    search:    jest.fn(),
    getDetail: jest.fn(),
    ...usdaOverrides,
  }
  const off: any = {
    search:       jest.fn(),
    getByBarcode: jest.fn(),
    ...offOverrides,
  }
  return new FoodsService(prisma, usda, off)
}

describe('FoodsService', () => {

  // ─── search local ────────────────────────────────────────────────────────
  describe('search local', () => {
    it('retorna resultados del catálogo local', async () => {
      const foods = [{ id: 'f-1', name: 'Chicken Breast', source: 'PRESET' }]
      const svc = buildService({
        food: { findMany: jest.fn().mockResolvedValue(foods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      })
      const result = await svc.search('chicken', 'local')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Chicken Breast')
    })

    it('retorna lista vacía si no hay coincidencias', async () => {
      const svc = buildService({
        food: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      })
      const result = await svc.search('xyz123', 'local')
      expect(result).toHaveLength(0)
    })
  })

  // ─── F-05: sort PRESET primero ───────────────────────────────────────────
  describe('F-05 — sort PRESET antes que CUSTOM y OFF', () => {
    it('ordena PRESET primero, luego CUSTOM, luego OFF', async () => {
      const foods = [
        { id: 'f-off',    name: 'Bar',     source: 'OFF'    },
        { id: 'f-custom', name: 'Custom',  source: 'CUSTOM' },
        { id: 'f-preset', name: 'Avena',   source: 'PRESET' },
      ]
      const svc = buildService({
        food: { findMany: jest.fn().mockResolvedValue(foods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      })
      const result = await svc.search('a', 'local')
      expect(result[0].source).toBe('PRESET')
      expect(result[1].source).toBe('CUSTOM')
      expect(result[2].source).toBe('OFF')
    })
  })

  // ─── F-04: mappers estáticos ─────────────────────────────────────────────
  describe('F-04 — mappers estáticos (sin pérdida de contexto this)', () => {
    it('mapUsdaToView construye id con prefijo usda-', () => {
      const usdaFood = {
        fdcId: 12345, description: 'Oatmeal', brandOwner: undefined,
        calories: 389, protein: 17, carbs: 66, fat: 7,
        servingSize: 100, servingSizeUnit: 'g',
        fiber: 10, sugar: undefined, sodium: undefined, saturatedFat: undefined, caffeineMg: undefined,
      }
      const view = FoodsService.mapUsdaToView(usdaFood)
      expect(view.id).toBe('usda-12345')
      expect(view.source).toBe('USDA')
      expect(view.calories).toBe(389)
    })

    it('mapOffToView construye id con prefijo off-', () => {
      const offFood = {
        barcode: '5000159484695', name: 'Nutella', brand: 'Ferrero',
        servingSizeG: 100, calories: 530, protein: 6.3, carbs: 57.5, fat: 31.6,
        fiber: undefined, sugar: 56.3, sodium: undefined, saturatedFat: 10.6,
        qualityStatus: 'PARTIAL' as const,
      }
      const view = FoodsService.mapOffToView(offFood)
      expect(view.id).toBe('off-5000159484695')
      expect(view.source).toBe('OFF')
      expect(view.qualityStatus).toBe('PARTIAL')
    })

    it('mapUsdaToView funciona al pasar como callback a .map() (no pierde this)', () => {
      // Antes del fix F-04 esto fallaba porque this era undefined
      const foods = [{ fdcId: 1, description: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }]
      const views = foods.map((f) => FoodsService.mapUsdaToView(f as any))
      expect(views[0].id).toBe('usda-1')
    })
  })

  // ─── search USDA con fallback F-03 ───────────────────────────────────────
  describe('search USDA con fallback (F-03)', () => {
    it('retorna resultados USDA mapeados si la API responde OK', async () => {
      const usdaResults = [{ fdcId: 1, description: 'Rice', calories: 365, protein: 7, carbs: 80, fat: 0.7 }]
      const svc = buildService(
        { food: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { search: jest.fn().mockResolvedValue(usdaResults) },
      )
      const result = await svc.search('rice', 'usda')
      expect(result).toHaveLength(1)
      expect(result[0].source).toBe('USDA')
      expect(result[0].id).toBe('usda-1')
    })

    it('retorna catálogo local si USDA falla con error de red (F-03)', async () => {
      const localFoods = [{ id: 'f-2', name: 'White Rice', source: 'PRESET' }]
      const svc = buildService(
        { food: { findMany: jest.fn().mockResolvedValue(localFoods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { search: jest.fn().mockRejectedValue(new Error('Network timeout')) },
      )
      const result = await svc.search('rice', 'usda')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('White Rice')
    })

    it('re-lanza el error si USDA responde 429', async () => {
      const rateLimitError = { getStatus: () => 429, message: 'Too Many Requests' }
      const svc = buildService({}, { search: jest.fn().mockRejectedValue(rateLimitError) })
      await expect(svc.search('anything', 'usda')).rejects.toMatchObject({ message: 'Too Many Requests' })
    })
  })

  // ─── search OFF con fallback ──────────────────────────────────────────────
  describe('search OFF con fallback', () => {
    it('retorna resultados OFF mapeados si la API responde OK', async () => {
      const offResults = [{
        barcode: '123', name: 'Protein Bar', brand: 'Generic',
        servingSizeG: 60, calories: 250, protein: 20, carbs: 25, fat: 8,
        qualityStatus: 'PARTIAL' as const,
      }]
      const svc = buildService(
        { food: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        {},
        { search: jest.fn().mockResolvedValue(offResults) },
      )
      const result = await svc.search('protein', 'off')
      expect(result).toHaveLength(1)
      expect(result[0].source).toBe('OFF')
      expect(result[0].id).toBe('off-123')
    })

    it('retorna catálogo local si OFF falla con error de red', async () => {
      const localFoods = [{ id: 'f-3', name: 'Whey Protein', source: 'PRESET' }]
      const svc = buildService(
        { food: { findMany: jest.fn().mockResolvedValue(localFoods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        {},
        { search: jest.fn().mockRejectedValue(new Error('Connection refused')) },
      )
      const result = await svc.search('protein', 'off')
      expect(result[0].name).toBe('Whey Protein')
    })
  })

  // ─── importFromUsda deduplicación F-01 ───────────────────────────────────
  describe('importFromUsda (F-01 — deduplicación)', () => {
    it('retorna el alimento existente si ya está en BD (no duplica)', async () => {
      const existing = { id: 'f-usda-1', name: 'Apple', source: 'USDA', externalId: '12345' }
      const createMock = jest.fn()
      const svc = buildService({
        food: { findFirst: jest.fn().mockResolvedValue(existing), findMany: jest.fn(), findUnique: jest.fn(), create: createMock },
      })
      const result = await svc.importFromUsda('12345')
      expect(result.id).toBe('f-usda-1')
      expect(createMock).not.toHaveBeenCalled()
    })

    it('importa y persiste si el alimento no existe aún', async () => {
      const detail = { fdcId: 99, description: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 }
      const created = { id: 'f-new', name: 'Oatmeal', source: 'USDA', externalId: '99' }
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn().mockResolvedValue(created) } },
        { getDetail: jest.fn().mockResolvedValue(detail) },
      )
      const result = await svc.importFromUsda('99')
      expect(result.name).toBe('Oatmeal')
      const foodMock = (svc as any).prisma.food
      expect(foodMock.create).toHaveBeenCalledTimes(1)
    })

    it('lanza NotFoundException si USDA getDetail retorna null', async () => {
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { getDetail: jest.fn().mockResolvedValue(null) },
      )
      await expect(svc.importFromUsda('999')).rejects.toThrow(NotFoundException)
    })

    it('lanza NotFoundException si USDA getDetail falla con error de red', async () => {
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { getDetail: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) },
      )
      await expect(svc.importFromUsda('888')).rejects.toThrow(NotFoundException)
    })
  })

  // ─── getByBarcode ─────────────────────────────────────────────────────────
  describe('getByBarcode', () => {
    it('retorna el alimento local si ya existe por barcode (caché)', async () => {
      const cached = { id: 'f-3', name: 'Protein Bar', barcode: '1234567890' }
      const svc = buildService({
        food: { findFirst: jest.fn().mockResolvedValue(cached), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      })
      const result = await svc.getByBarcode('1234567890')
      expect(result.id).toBe('f-3')
    })

    it('lanza NotFoundException si el barcode no existe en OFF ni en local', async () => {
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        {},
        { getByBarcode: jest.fn().mockResolvedValue(null) },
      )
      await expect(svc.getByBarcode('0000000000')).rejects.toThrow(NotFoundException)
    })

    it('importa desde OFF si no está en caché local', async () => {
      const offFood = {
        barcode: '9876543210', name: 'Granola Bar', brand: 'Nature',
        servingSizeG: 50, calories: 200, protein: 4, carbs: 30, fat: 7,
        qualityStatus: 'COMPLETE' as const,
      }
      const created = { id: 'f-off-new', name: 'Granola Bar', barcode: '9876543210' }
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn().mockResolvedValue(created) } },
        {},
        { getByBarcode: jest.fn().mockResolvedValue(offFood) },
      )
      const result = await svc.getByBarcode('9876543210')
      expect(result.name).toBe('Granola Bar')
    })
  })

  // ─── createCustomFood ─────────────────────────────────────────────────────
  describe('createCustomFood', () => {
    it('crea y retorna el alimento personalizado con source CUSTOM', async () => {
      const dto = { name: 'My Food', calories: 200, protein: 10, carbs: 20, fat: 8 }
      const created = { id: 'f-custom', ...dto, source: 'CUSTOM', qualityStatus: 'COMPLETE' }
      const svc = buildService({
        food: { create: jest.fn().mockResolvedValue(created), findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
      })
      const result = await svc.createCustomFood(dto)
      expect(result.source).toBe('CUSTOM')
      expect(result.qualityStatus).toBe('COMPLETE')
    })

    it('persiste todos los campos nutricionales del DTO', async () => {
      const dto = { name: 'Full Food', calories: 300, protein: 25, carbs: 30, fat: 10, fiber: 5, sodium: 200, caffeineMg: 80 }
      const createMock = jest.fn().mockResolvedValue({ id: 'f-full', ...dto, source: 'CUSTOM', qualityStatus: 'COMPLETE' })
      const svc = buildService({ food: { create: createMock, findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() } })
      await svc.createCustomFood(dto)
      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Full Food', caffeineMg: 80, source: 'CUSTOM' }),
      })
    })
  })
})
