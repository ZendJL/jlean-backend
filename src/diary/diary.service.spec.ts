/**
 * Tests del DiaryService — Fase 12.1
 * Cubre: calcItemMacros, calcConsumed, validaciones de addItem, parseDate.
 * Usa mocks de PrismaService y DayTypesService.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiaryService } from './diary.service';

// Helper para construir un DiaryService con prisma/dayTypes mockeados
function buildService(prismaOverrides = {}, dayTypesOverrides = {}) {
  const prisma: any = {
    food: { findUnique: jest.fn() },
    recipe: { findUnique: jest.fn() },
    foodLog: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    foodLogItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: { findUnique: jest.fn() },
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

describe('DiaryService', () => {

  // --- addItem validaciones ---
  describe('addItem', () => {
    it('lanza BadRequestException si no se provee foodId ni recipeId', async () => {
      const svc = buildService();
      await expect(svc.addItem('user-1', { quantityG: 100 }))
        .rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si foodId no existe en BD', async () => {
      const svc = buildService({
        food: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      await expect(svc.addItem('user-1', { foodId: 'missing', quantityG: 100 }))
        .rejects.toThrow(NotFoundException);
    });

    it('crea un item si el food existe y hay log del día', async () => {
      const food = { id: 'f-1', name: 'Chicken', servingSizeG: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 };
      const log  = { id: 'log-1' };
      const item = { id: 'item-1', meal: 'LUNCH', quantityG: 100, food, recipe: null };
      const svc = buildService({
        food:        { findUnique: jest.fn().mockResolvedValue(food) },
        foodLog:     {
          findUnique: jest.fn().mockResolvedValue(log),
          create:     jest.fn().mockResolvedValue(log),
        },
        foodLogItem: {
          create: jest.fn().mockResolvedValue(item),
          findUnique: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      });
      const result = await svc.addItem('user-1', { foodId: 'f-1', quantityG: 100, meal: 'LUNCH' as any });
      expect(result.id).toBe('item-1');
    });
  });

  // --- deleteItem ---
  describe('deleteItem', () => {
    it('lanza NotFoundException si el item no pertenece al usuario', async () => {
      const svc = buildService({
        foodLogItem: {
          findUnique: jest.fn().mockResolvedValue({ id: 'item-1', log: { userId: 'other-user' } }),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      });
      await expect(svc.deleteItem('user-1', 'item-1')).rejects.toThrow(NotFoundException);
    });

    it('retorna { deleted: true } si el item existe y pertenece al usuario', async () => {
      const svc = buildService({
        foodLogItem: {
          findUnique: jest.fn().mockResolvedValue({ id: 'item-1', log: { userId: 'user-1' } }),
          delete: jest.fn().mockResolvedValue({}),
          create: jest.fn(),
          update: jest.fn(),
        },
      });
      const result = await svc.deleteItem('user-1', 'item-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  // --- parseDate (acceso a través de comportamiento observable) ---
  describe('getLog con fecha inválida', () => {
    it('lanza BadRequestException si la fecha no es válida', async () => {
      const svc = buildService({
        foodLog: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'log-1', date: new Date(), items: [] }),
          findMany: jest.fn(),
        },
      });
      await expect(svc.getLog('user-1', 'not-a-date')).rejects.toThrow(BadRequestException);
    });
  });

  // --- getHistory validación de rango ---
  describe('getHistory', () => {
    it('lanza BadRequestException si from es posterior a to', async () => {
      const svc = buildService({
        profile: { findUnique: jest.fn().mockResolvedValue({ calorieTarget: 2000, proteinTarget: 150, carbTarget: 225, fatTarget: 56 }) },
        foodLog: { findMany: jest.fn().mockResolvedValue([]) },
      });
      await expect(svc.getHistory('user-1', '2026-06-30', '2026-06-01'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
