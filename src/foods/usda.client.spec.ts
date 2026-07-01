/**
 * Unit tests — UsdaClient normalizadores — Paso 12.1
 * Testea normalizeSearchItem y normalizeDetail sin hacer llamadas HTTP reales.
 * Los métodos privados se acceden via (client as any) para test de caja blanca.
 */
import { ConfigService } from '@nestjs/config'
import { UsdaClient } from './usda.client'
import { ExternalApiMonitorService } from '../common/services/external-api-monitor.service'

function buildClient() {
  const config: any = { get: jest.fn().mockReturnValue('DEMO_KEY') }
  const monitor: any = { record: jest.fn() }
  return new UsdaClient(config as ConfigService, monitor as ExternalApiMonitorService)
}

describe('UsdaClient — normalizadores', () => {

  describe('normalizeSearchItem', () => {
    it('extrae macros correctamente por nutrientId', () => {
      const raw = {
        fdcId: 12345,
        description: 'Oatmeal, regular, unenriched',
        brandOwner: undefined,
        servingSize: 100,
        servingSizeUnit: 'g',
        foodNutrients: [
          { nutrientId: 1008, value: 389 },  // calories
          { nutrientId: 1003, value: 17 },   // protein
          { nutrientId: 1005, value: 66 },   // carbs
          { nutrientId: 1004, value: 7 },    // fat
          { nutrientId: 1079, value: 10.6 }, // fiber
          { nutrientId: 1093, value: 2 },    // sodium
          { nutrientId: 2000, value: 0 },    // sugar — valor 0 no se incluye
        ],
      }
      const client = buildClient()
      const result = (client as any).normalizeSearchItem(raw)
      expect(result.fdcId).toBe(12345)
      expect(result.calories).toBe(389)
      expect(result.protein).toBe(17)
      expect(result.carbs).toBe(66)
      expect(result.fat).toBe(7)
      expect(result.fiber).toBe(10.6)
      expect(result.sodium).toBe(2)
      // sugar=0 → undefined (falsy || undefined)
      expect(result.sugar).toBeUndefined()
    })

    it('retorna 0 para nutrientes no presentes en la lista', () => {
      const raw = {
        fdcId: 99, description: 'Unknown food', foodNutrients: [],
      }
      const client = buildClient()
      const result = (client as any).normalizeSearchItem(raw)
      expect(result.calories).toBe(0)
      expect(result.protein).toBe(0)
      expect(result.carbs).toBe(0)
      expect(result.fat).toBe(0)
    })

    it('preserva descripción y brandOwner', () => {
      const raw = {
        fdcId: 1, description: 'Chicken Breast, cooked', brandOwner: 'Tyson Foods',
        foodNutrients: [{ nutrientId: 1008, value: 165 }],
      }
      const client = buildClient()
      const result = (client as any).normalizeSearchItem(raw)
      expect(result.description).toBe('Chicken Breast, cooked')
      expect(result.brandOwner).toBe('Tyson Foods')
    })
  })

  describe('normalizeDetail', () => {
    it('extrae macros del formato de detalle (nutrient.id anidado)', () => {
      const raw = {
        fdcId: 55555,
        description: 'Brown Rice, cooked',
        servingSize: 100,
        servingSizeUnit: 'g',
        foodNutrients: [
          { nutrient: { id: 1008 }, amount: 112 },  // calories
          { nutrient: { id: 1003 }, amount: 2.6 },  // protein
          { nutrient: { id: 1005 }, amount: 23.5 }, // carbs
          { nutrient: { id: 1004 }, amount: 0.9 },  // fat
          { nutrient: { id: 1079 }, amount: 1.8 },  // fiber
          { nutrient: { id: 1057 }, amount: 0 },    // caffeine — 0 → undefined
        ],
      }
      const client = buildClient()
      const result = (client as any).normalizeDetail(raw)
      expect(result.fdcId).toBe(55555)
      expect(result.calories).toBe(112)
      expect(result.protein).toBe(2.6)
      expect(result.carbs).toBe(23.5)
      expect(result.fat).toBe(0.9)
      expect(result.fiber).toBe(1.8)
      expect(result.caffeineMg).toBeUndefined()
    })

    it('retorna 0 si el nutriente no está presente', () => {
      const raw = { fdcId: 1, description: 'Water', foodNutrients: [] }
      const client = buildClient()
      const result = (client as any).normalizeDetail(raw)
      expect(result.calories).toBe(0)
      expect(result.fat).toBe(0)
    })
  })

  describe('getNutrientValue', () => {
    it('usa nutrientId si está disponible', () => {
      const client = buildClient()
      const nutrients = [{ nutrientId: 1003, value: 20 }]
      const val = (client as any).getNutrientValue(nutrients, 1003)
      expect(val).toBe(20)
    })

    it('usa number (string) como fallback si no hay nutrientId', () => {
      const client = buildClient()
      const nutrients = [{ number: '1003', value: 15 }]
      const val = (client as any).getNutrientValue(nutrients, 1003)
      expect(val).toBe(15)
    })

    it('retorna 0 si el nutriente no está en la lista', () => {
      const client = buildClient()
      const val = (client as any).getNutrientValue([], 1008)
      expect(val).toBe(0)
    })
  })
})
