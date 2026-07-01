/**
 * Tests del DiaryService — Fase 12.1 (actualizado con cobertura de alertas)
 * Cubre: calcItemMacros, calcConsumed, validaciones de addItem,
 *        motor de alertas (cafeína/alcohol/sodio/alérgenos), parseDate, historial.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DiaryService } from './diary.service';

// ── Datos de fixture ─────────────────────────────────────────────────────────
const FOOD_CHICKEN = {
  id: 'f-chicken', name: 'Chicken Breast', servingSizeG: 100,
  calories: 165, protein: 31, carbs: 0, fat: 3.6,
  caffeineMg: 0, alcoholG: 0, sodiumMg: 74, allergens: [],
};

const FOOD_COFFEE = {
  id: 'f-coffee', name: 'Black Coffee', servingSizeG: 240,
  calories: 2, protein: 0.3, carbs: 0, fat: 0,
  caffeineMg: 95, alcoholG: 0, sodiumMg: 5, allergens: [],
};

const FOOD_BEER = {
  id: 'f-beer', name: 'Beer (355ml)', servingSizeG: 355,
  calories: 153, protein: 1.6, carbs: 12.6, fat: 0,
  caffeineMg: 0, alcoholG: 14, sodiumMg: 14, allergens: ['gluten'],
};

const FOOD_SALTY = {
  id: 'f-salty', name: 'Salty Snack', servingSizeG: 100,
  calories: 520, protein: 8, carbs: 60, fat: 28,
  caffeineMg: 0, alcoholG: 0, sodiumMg: 2400, allergens: [],
};

const LOG_EMPTY = { id: 'log-1', items: [] };

// ── Helper factory ────────────────────────────────────────────────────────────
function buildService(prismaOverrides: Record<string, any> = {}, dayTypesOverrides = {}) {
  const prisma: any = {
    food:        { findUnique: jest.fn() },
    recipe:      { findUnique: jest.fn() },
    foodLog:     {
      findUnique: jest.fn().mockResolvedValue(LOG_EMPTY),
      create:     jest.fn().mockResolvedValue(LOG_EMPTY),
      findMany:   jest.fn().mockResolvedValue([]),
    },
    foodLogItem: {
      create:     jest.fn(),
      findUnique: jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
    },
    profile: { findUnique: jest.fn().mockResolvedValue({ calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56, allergens: [] }) },
    supplementLog: { findMany: jest.fn().mockResolvedValue([]) },
    ...prismaOverrides,
  };
  const dayTypes: any = {
    getAdjustedTargets: jest.fn().mockResolvedValue({
      adjusted: { calories: 2000, protein: 150, carbs: 225, fat: 56 },
      dayType: null,
      factor: 1,
    }),
    ...dayTypesOverrides,
  };
  return new DiaryService(prisma, dayTypes);
}

// ── Helpers para construir mocks de addItem ───────────────────────────────────
function mockFoodAdd(svc: DiaryService, prisma: any, food: any) {
  prisma.food.findUnique.mockResolvedValue(food);
  prisma.foodLogItem.create.mockResolvedValue({ id: 'item-new', meal: 'LUNCH', quantityG: 100, food, recipe: null });
}

// =============================================================================
describe('DiaryService', () => {

  // ── addItem: validaciones básicas ──────────────────────────────────────────
  describe('addItem — validaciones básicas', () => {
    it('lanza BadRequestException si no hay foodId ni recipeId', async () => {
      const svc = buildService();
      await expect(svc.addItem('u-1', { quantityG: 100 }))
        .rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si foodId no existe en BD', async () => {
      const svc = buildService({ food: { findUnique: jest.fn().mockResolvedValue(null) } });
      await expect(svc.addItem('u-1', { foodId: 'missing', quantityG: 100 }))
        .rejects.toThrow(NotFoundException);
    });

    it('retorna { item, macros, alerts:[] } si todo está OK y no hay alertas', async () => {
      const prisma: any = {
        food:        { findUnique: jest.fn().mockResolvedValue(FOOD_CHICKEN) },
        recipe:      { findUnique: jest.fn() },
        foodLog:     { findUnique: jest.fn().mockResolvedValue(LOG_EMPTY), create: jest.fn(), findMany: jest.fn() },
        foodLogItem: { create: jest.fn().mockResolvedValue({ id: 'item-1', meal: 'LUNCH', quantityG: 100, food: FOOD_CHICKEN, recipe: null }), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        profile:     { findUnique: jest.fn().mockResolvedValue({ allergens: [] }) },
      };
      const svc = buildService(prisma);
      const result = await svc.addItem('u-1', { foodId: 'f-chicken', quantityG: 100, meal: 'LUNCH' as any });
      expect(result.alerts).toEqual([]);
      expect(result.item.id).toBe('item-1');
    });
  });

  // ── addItem: motor de alertas (Bug-1 fix) ──────────────────────────────────
  describe('addItem — motor de alertas (Bug-1)', () => {

    it('emite CAFFEINE_LIMIT si total cafeína supera 400mg', async () => {
      // El log ya tiene 5 cafés (5×95mg = 475mg). Un café más = 570mg > 400.
      const prevItems = Array(5).fill(null).map((_, i) => ({
        id: `item-${i}`, quantityG: 240, food: FOOD_COFFEE, recipe: null,
      }));
      const prisma: any = {
        food:        { findUnique: jest.fn().mockResolvedValue(FOOD_COFFEE) },
        recipe:      { findUnique: jest.fn() },
        foodLog:     { findUnique: jest.fn().mockResolvedValue({ id: 'log-1', items: prevItems }), create: jest.fn(), findMany: jest.fn() },
        foodLogItem: { create: jest.fn().mockResolvedValue({ id: 'item-new', meal: 'OTHER', quantityG: 240, food: FOOD_COFFEE, recipe: null }), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        profile:     { findUnique: jest.fn().mockResolvedValue({ allergens: [] }) },
      };
      const svc = buildService(prisma);
      const result = await svc.addItem('u-1', { foodId: 'f-coffee', quantityG: 240 });
      const types = result.alerts.map((a: any) => a.type);
      expect(types).toContain('CAFFEINE_LIMIT');
    });

    it('emite ALCOHOL_DETECTED si el alimento tiene alcoholG > 0', async () => {
      const prisma: any = {
        food:        { findUnique: jest.fn().mockResolvedValue(FOOD_BEER) },
        recipe:      { findUnique: jest.fn() },
        foodLog:     { findUnique: jest.fn().mockResolvedValue(LOG_EMPTY), create: jest.fn(), findMany: jest.fn() },
        foodLogItem: { create: jest.fn().mockResolvedValue({ id: 'item-2', meal: 'OTHER', quantityG: 355, food: FOOD_BEER, recipe: null }), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        profile:     { findUnique: jest.fn().mockResolvedValue({ allergens: [] }) },
      };
      const svc = buildService(prisma);
      const result = await svc.addItem('u-1', { foodId: 'f-beer', quantityG: 355 });
      const types = result.alerts.map((a: any) => a.type);
      expect(types).toContain('ALCOHOL_DETECTED');
    });

    it('emite SODIUM_HIGH si sodio total supera 2300mg', async () => {
      const prisma: any = {
        food:        { findUnique: jest.fn().mockResolvedValue(FOOD_SALTY) },
        recipe:      { findUnique: jest.fn() },
        foodLog:     { findUnique: jest.fn().mockResolvedValue(LOG_EMPTY), create: jest.fn(), findMany: jest.fn() },
        foodLogItem: { create: jest.fn().mockResolvedValue({ id: 'item-3', meal: 'OTHER', quantityG: 100, food: FOOD_SALTY, recipe: null }), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        profile:     { findUnique: jest.fn().mockResolvedValue({ allergens: [] }) },
      };
      const svc = buildService(prisma);
      const result = await svc.addItem('u-1', { foodId: 'f-salty', quantityG: 100 });
      const types = result.alerts.map((a: any) => a.type);
      expect(types).toContain('SODIUM_HIGH');
    });

    it('lanza ForbiddenException (y NO inserta) si el alimento tiene alérgeno declarado por el usuario', async () => {
      const prisma: any = {
        food:        { findUnique: jest.fn().mockResolvedValue(FOOD_BEER) },
        recipe:      { findUnique: jest.fn() },
        foodLog:     { findUnique: jest.fn().mockResolvedValue(LOG_EMPTY), create: jest.fn(), findMany: jest.fn() },
        foodLogItem: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        profile:     { findUnique: jest.fn().mockResolvedValue({ allergens: ['gluten'] }) },
      };
      const svc = buildService(prisma);
      await expect(svc.addItem('u-1', { foodId: 'f-beer', quantityG: 355 }))
        .rejects.toThrow(ForbiddenException);
      // El create NO debe haber sido llamado
      expect(prisma.foodLogItem.create).not.toHaveBeenCalled();
    });
  });

  // ── calcItemMacros ─────────────────────────────────────────────────────────
  describe('calcItemMacros', () => {
    it('calcula correctamente para 200g de pollo (ratio=2)', () => {
      const svc = buildService();
      const result = svc.calcItemMacros({ food: FOOD_CHICKEN, recipe: null, quantityG: 200 });
      expect(result.calories).toBe(330);
      expect(result.protein).toBe(62);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(7.2);
    });

    it('devuelve ceros si no hay food ni recipe', () => {
      const svc = buildService();
      const result = svc.calcItemMacros({ food: null, recipe: null, quantityG: 100 });
      expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });

    it('calcula correctamente desde una receta con 2 porciones', () => {
      const recipe = {
        servings: 2,
        items: [
          { quantityG: 200, food: FOOD_CHICKEN },
        ],
      };
      const svc = buildService();
      // 1 porción de la receta = 100g de pollo
      const result = svc.calcItemMacros({ food: null, recipe, quantityG: 1 });
      expect(result.calories).toBe(165);
      expect(result.protein).toBe(31);
    });
  });

  // ── calcConsumed ───────────────────────────────────────────────────────────
  describe('calcConsumed', () => {
    it('suma correctamente varios ítems', () => {
      const svc = buildService();
      const items = [
        { food: FOOD_CHICKEN, recipe: null, quantityG: 100 },
        { food: FOOD_CHICKEN, recipe: null, quantityG: 100 },
      ];
      const result = svc.calcConsumed(items);
      expect(result.calories).toBe(330);
      expect(result.protein).toBe(62);
    });

    it('retorna ceros para lista vacía', () => {
      const svc = buildService();
      expect(svc.calcConsumed([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });
  });

  // ── deleteItem ─────────────────────────────────────────────────────────────
  describe('deleteItem', () => {
    it('lanza NotFoundException si el item no pertenece al usuario', async () => {
      const svc = buildService({
        foodLogItem: { findUnique: jest.fn().mockResolvedValue({ id: 'item-1', log: { userId: 'other' } }), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      });
      await expect(svc.deleteItem('u-1', 'item-1')).rejects.toThrow(NotFoundException);
    });

    it('retorna { deleted: true } si el item es del usuario', async () => {
      const svc = buildService({
        foodLogItem: { findUnique: jest.fn().mockResolvedValue({ id: 'item-1', log: { userId: 'u-1' } }), delete: jest.fn().mockResolvedValue({}), create: jest.fn(), update: jest.fn() },
      });
      expect(await svc.deleteItem('u-1', 'item-1')).toEqual({ deleted: true });
    });
  });

  // ── getLog / parseDate ─────────────────────────────────────────────────────
  describe('getLog — fecha inválida', () => {
    it('lanza BadRequestException si la fecha no es válida', async () => {
      const svc = buildService({
        foodLog: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'log-1', date: new Date(), items: [] }), findMany: jest.fn() },
      });
      await expect(svc.getLog('u-1', 'not-a-date')).rejects.toThrow(BadRequestException);
    });
  });

  // ── getHistory ─────────────────────────────────────────────────────────────
  describe('getHistory', () => {
    it('lanza BadRequestException si from es posterior a to', async () => {
      const svc = buildService({
        profile: { findUnique: jest.fn().mockResolvedValue({ calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56 }) },
        foodLog: { findMany: jest.fn().mockResolvedValue([]) },
      });
      await expect(svc.getHistory('u-1', '2026-06-30', '2026-06-01'))
        .rejects.toThrow(BadRequestException);
    });

    it('retorna 7 días aunque no haya logs', async () => {
      const svc = buildService({
        profile: { findUnique: jest.fn().mockResolvedValue({ calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56 }) },
        foodLog: { findMany: jest.fn().mockResolvedValue([]) },
      });
      const result = await svc.getHistory('u-1', '2026-06-01', '2026-06-07');
      expect(result.days).toHaveLength(7);
      result.days.forEach((d: any) => {
        expect(d.consumed.calories).toBe(0);
      });
    });
  });

});
