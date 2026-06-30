/**
 * Tests del FoodsService — Fase 12.1
 * Cubre: search (local/USDA fallback), importFromUsda (deduplicación F-01),
 *        getByBarcode, createCustomFood.
 */
import { FoodsService } from './foods.service';
import { NotFoundException } from '@nestjs/common';

function buildService(prismaOverrides = {}, usdaOverrides = {}, offOverrides = {}) {
  const prisma: any = {
    food: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ...prismaOverrides,
  };
  const usda: any = {
    search: jest.fn(),
    getDetail: jest.fn(),
    ...usdaOverrides,
  };
  const off: any = {
    search: jest.fn(),
    getByBarcode: jest.fn(),
    ...offOverrides,
  };
  return new FoodsService(prisma, usda, off);
}

describe('FoodsService', () => {

  // --- search local ---
  describe('search local', () => {
    it('retorna resultados del catálogo local', async () => {
      const foods = [{ id: 'f-1', name: 'Chicken Breast' }];
      const svc = buildService({ food: { findMany: jest.fn().mockResolvedValue(foods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } });
      const result = await svc.search('chicken', 'local');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Chicken Breast');
    });
  });

  // --- search USDA fallback (F-03) ---
  describe('search USDA con fallback', () => {
    it('retorna catálogo local si USDA falla con error de red', async () => {
      const localFoods = [{ id: 'f-2', name: 'White Rice' }];
      const svc = buildService(
        { food: { findMany: jest.fn().mockResolvedValue(localFoods), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { search: jest.fn().mockRejectedValue(new Error('Network timeout')) },
      );
      const result = await svc.search('rice', 'usda');
      // F-03: fallback a local
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('White Rice');
    });

    it('re-lanza el error si USDA responde 429', async () => {
      const rateLimitError = { getStatus: () => 429, message: 'Too Many Requests' };
      const svc = buildService({}, { search: jest.fn().mockRejectedValue(rateLimitError) });
      await expect(svc.search('anything', 'usda')).rejects.toMatchObject({ message: 'Too Many Requests' });
    });
  });

  // --- importFromUsda deduplicación (F-01) ---
  describe('importFromUsda', () => {
    it('retorna el alimento existente si ya está en BD (no duplica)', async () => {
      const existing = { id: 'f-usda-1', name: 'Apple', source: 'USDA', externalId: '12345' };
      const svc = buildService({
        food: {
          findFirst: jest.fn().mockResolvedValue(existing),
          findMany: jest.fn(), findUnique: jest.fn(),
          create: jest.fn(),
        },
      });
      const result = await svc.importFromUsda('12345');
      expect(result.id).toBe('f-usda-1');
      // No debe haber llamado create
      const foodMock = (svc as any).prisma.food;
      expect(foodMock.create).not.toHaveBeenCalled();
    });

    it('importa y persiste si el alimento no existe aún', async () => {
      const detail = { fdcId: 99, description: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 };
      const created = { id: 'f-new', name: 'Oatmeal', source: 'USDA', externalId: '99' };
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn().mockResolvedValue(created) } },
        { getDetail: jest.fn().mockResolvedValue(detail) },
      );
      const result = await svc.importFromUsda('99');
      expect(result.name).toBe('Oatmeal');
      const foodMock = (svc as any).prisma.food;
      expect(foodMock.create).toHaveBeenCalled();
    });

    it('lanza NotFoundException si USDA getDetail retorna null', async () => {
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        { getDetail: jest.fn().mockResolvedValue(null) },
      );
      await expect(svc.importFromUsda('999')).rejects.toThrow(NotFoundException);
    });
  });

  // --- getByBarcode ---
  describe('getByBarcode', () => {
    it('retorna el alimento local si ya existe por barcode', async () => {
      const cached = { id: 'f-3', name: 'Protein Bar', barcode: '1234567890' };
      const svc = buildService({
        food: { findFirst: jest.fn().mockResolvedValue(cached), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      });
      const result = await svc.getByBarcode('1234567890');
      expect(result.id).toBe('f-3');
    });

    it('lanza NotFoundException si el barcode no existe en OFF ni en local', async () => {
      const svc = buildService(
        { food: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() } },
        {},
        { getByBarcode: jest.fn().mockResolvedValue(null) },
      );
      await expect(svc.getByBarcode('0000000000')).rejects.toThrow(NotFoundException);
    });
  });

  // --- createCustomFood ---
  describe('createCustomFood', () => {
    it('crea y retorna el alimento personalizado', async () => {
      const dto = { name: 'My Food', calories: 200, protein: 10, carbs: 20, fat: 8 };
      const created = { id: 'f-custom', ...dto, source: 'CUSTOM', qualityStatus: 'COMPLETE' };
      const svc = buildService({
        food: { create: jest.fn().mockResolvedValue(created), findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
      });
      const result = await svc.createCustomFood(dto);
      expect(result.source).toBe('CUSTOM');
    });
  });
});
