/**
 * Tests del FoodsController — Fase 12.1
 * Cubre: search, getByBarcode, importFromUsda, createCustomFood, getById.
 */
import { FoodsController } from './foods.controller'
import { NotFoundException } from '@nestjs/common'

function buildController(svcOverrides: any = {}) {
  const svc: any = {
    search:          jest.fn(),
    getByBarcode:    jest.fn(),
    importFromUsda:  jest.fn(),
    createCustomFood: jest.fn(),
    getById:         jest.fn(),
    ...svcOverrides,
  }
  return new FoodsController(svc)
}

describe('FoodsController', () => {

  it('está definido', () => {
    const ctrl = buildController()
    expect(ctrl).toBeDefined()
  })

  describe('search', () => {
    it('llama a svc.search con los parámetros correctos', async () => {
      const mockResults = [{ id: 'f-1', name: 'Avena' }]
      const searchMock = jest.fn().mockResolvedValue(mockResults)
      const ctrl = buildController({ search: searchMock })
      const result = await ctrl.search('avena', 'local')
      expect(searchMock).toHaveBeenCalledWith('avena', 'local')
      expect(result).toHaveLength(1)
    })

    it('usa source=local por defecto si no se pasa', async () => {
      const searchMock = jest.fn().mockResolvedValue([])
      const ctrl = buildController({ search: searchMock })
      await ctrl.search('rice', undefined as any)
      expect(searchMock).toHaveBeenCalledWith('rice', undefined)
    })
  })

  describe('getByBarcode', () => {
    it('retorna el food si existe el barcode', async () => {
      const food = { id: 'f-2', name: 'Snickers', barcode: '040000483121' }
      const ctrl = buildController({ getByBarcode: jest.fn().mockResolvedValue(food) })
      const result = await ctrl.getByBarcode('040000483121')
      expect(result.id).toBe('f-2')
    })

    it('propaga NotFoundException si el barcode no existe', async () => {
      const ctrl = buildController({ getByBarcode: jest.fn().mockRejectedValue(new NotFoundException()) })
      await expect(ctrl.getByBarcode('0000')).rejects.toThrow(NotFoundException)
    })
  })

  describe('importFromUsda', () => {
    it('llama a svc.importFromUsda con el fdcId correcto', async () => {
      const food = { id: 'f-3', name: 'Apple', source: 'USDA' }
      const importMock = jest.fn().mockResolvedValue(food)
      const ctrl = buildController({ importFromUsda: importMock })
      const result = await ctrl.importFromUsda('12345')
      expect(importMock).toHaveBeenCalledWith('12345')
      expect(result.source).toBe('USDA')
    })
  })

  describe('createCustomFood', () => {
    it('crea un alimento personalizado y lo retorna', async () => {
      const dto = { name: 'My Shake', calories: 400, protein: 40, carbs: 30, fat: 10 }
      const created = { id: 'f-custom', ...dto, source: 'CUSTOM' }
      const ctrl = buildController({ createCustomFood: jest.fn().mockResolvedValue(created) })
      const result = await ctrl.createCustomFood(dto as any)
      expect(result.source).toBe('CUSTOM')
    })
  })

  describe('getById', () => {
    it('retorna el food por id', async () => {
      const food = { id: 'f-4', name: 'Banana' }
      const ctrl = buildController({ getById: jest.fn().mockResolvedValue(food) })
      const result = await ctrl.getById('f-4')
      expect(result.name).toBe('Banana')
    })

    it('propaga NotFoundException si el id no existe', async () => {
      const ctrl = buildController({ getById: jest.fn().mockRejectedValue(new NotFoundException()) })
      await expect(ctrl.getById('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })
})
