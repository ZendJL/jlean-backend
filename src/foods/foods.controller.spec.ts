/**
 * Tests del FoodsController — Fase 12.1
 * Cubre: GET /foods/search, GET /foods/barcode/:barcode,
 *        POST /foods/import/usda/:fdcId, POST /foods/custom.
 * Usa mock completo del FoodsService para testear solo la capa del controller.
 */
import { Test, TestingModule } from '@nestjs/testing'
import { FoodsController } from './foods.controller'
import { FoodsService } from './foods.service'
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common'

const mockFoodsService = {
  search:          jest.fn(),
  getByBarcode:    jest.fn(),
  getById:         jest.fn(),
  importFromUsda:  jest.fn(),
  createCustomFood: jest.fn(),
}

describe('FoodsController', () => {
  let controller: FoodsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodsController],
      providers: [{ provide: FoodsService, useValue: mockFoodsService }],
    }).compile()

    controller = module.get<FoodsController>(FoodsController)
    jest.clearAllMocks()
  })

  // ─── GET /foods/search ────────────────────────────────────────────────────
  describe('GET /foods/search', () => {
    it('busca en fuente local por defecto y retorna resultados', async () => {
      const foods = [{ id: 'f-1', name: 'Chicken Breast', source: 'PRESET' }]
      mockFoodsService.search.mockResolvedValue(foods)

      const result = await controller.search('chicken', 'local')
      expect(result).toHaveLength(1)
      expect(mockFoodsService.search).toHaveBeenCalledWith('chicken', 'local')
    })

    it('pasa la fuente usda al servicio cuando se especifica', async () => {
      mockFoodsService.search.mockResolvedValue([])
      await controller.search('rice', 'usda')
      expect(mockFoodsService.search).toHaveBeenCalledWith('rice', 'usda')
    })

    it('expone el error 429 al cliente si USDA está rate limited', async () => {
      const err = new HttpException(
        { message: 'USDA rate limit reached.', retryAfterSeconds: 60, source: 'USDA' },
        HttpStatus.TOO_MANY_REQUESTS,
      )
      mockFoodsService.search.mockRejectedValue(err)
      await expect(controller.search('rice', 'usda')).rejects.toThrow(HttpException)
    })
  })

  // ─── GET /foods/barcode/:barcode ──────────────────────────────────────────
  describe('GET /foods/barcode/:barcode', () => {
    it('retorna el alimento por barcode', async () => {
      const food = { id: 'f-2', name: 'Granola Bar', barcode: '123456' }
      mockFoodsService.getByBarcode.mockResolvedValue(food)

      const result = await controller.getByBarcode('123456')
      expect(result.barcode).toBe('123456')
    })

    it('propaga NotFoundException si no se encuentra el barcode', async () => {
      mockFoodsService.getByBarcode.mockRejectedValue(
        new NotFoundException('Food with barcode 000 not found'),
      )
      await expect(controller.getByBarcode('000')).rejects.toThrow(NotFoundException)
    })
  })

  // ─── POST /foods/import/usda/:fdcId ───────────────────────────────────────
  describe('POST /foods/import/usda/:fdcId', () => {
    it('importa y retorna el alimento USDA', async () => {
      const food = { id: 'f-usda', name: 'Oatmeal', source: 'USDA', externalId: '173904' }
      mockFoodsService.importFromUsda.mockResolvedValue(food)

      const result = await controller.importFromUsda('173904')
      expect(result.source).toBe('USDA')
      expect(mockFoodsService.importFromUsda).toHaveBeenCalledWith('173904')
    })

    it('propaga 429 si USDA está rate limited durante import', async () => {
      const err = new HttpException({ message: 'Rate limit', source: 'USDA' }, HttpStatus.TOO_MANY_REQUESTS)
      mockFoodsService.importFromUsda.mockRejectedValue(err)
      await expect(controller.importFromUsda('173904')).rejects.toThrow(HttpException)
    })
  })

  // ─── POST /foods/custom ───────────────────────────────────────────────────
  describe('POST /foods/custom', () => {
    it('crea un alimento personalizado y lo retorna', async () => {
      const dto = { name: 'My Shake', calories: 350, protein: 30, carbs: 40, fat: 8 }
      const created = { id: 'f-custom', ...dto, source: 'CUSTOM', qualityStatus: 'COMPLETE' }
      mockFoodsService.createCustomFood.mockResolvedValue(created)

      const result = await controller.createCustomFood(dto as any)
      expect(result.source).toBe('CUSTOM')
      expect(mockFoodsService.createCustomFood).toHaveBeenCalledWith(dto)
    })
  })
})
